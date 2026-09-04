-- Update an order and its inventory impact as one transaction.
-- The existing create_order RPC deducts stock regardless of the order status,
-- so this function uses the same model and deliberately leaves status unchanged.
CREATE OR REPLACE FUNCTION public.update_order(
  p_order_id UUID,
  p_docket_number TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC(10,2);
  v_total NUMERIC(10,2) := 0;
  v_item_count INTEGER := 0;
  v_previous_stock INTEGER;
  v_old_item RECORD;
  v_old_prices JSONB := '{}'::JSONB;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only administrators can update orders'
      USING ERRCODE = '42501';
  END IF;

  IF p_docket_number IS NULL OR btrim(p_docket_number) = '' THEN
    RAISE EXCEPTION 'Docket number is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'An order must contain at least one item';
  END IF;

  -- Validate client input before changing any data. Prices and totals are never
  -- accepted from the client.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_count := v_item_count + 1;

    IF jsonb_typeof(v_item) <> 'object'
       OR COALESCE(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR COALESCE(v_item->>'quantity', '') !~ '^[1-9][0-9]*$' THEN
      RAISE EXCEPTION 'Each order item requires a valid product and a quantity greater than zero';
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'An order must contain at least one item';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Lock every affected product in a consistent order. This serializes stock
  -- changes and avoids deadlocks when concurrent orders share products.
  PERFORM p.id
  FROM public.products AS p
  WHERE p.id IN (
    SELECT oi.product_id FROM public.order_items AS oi WHERE oi.order_id = p_order_id
    UNION
    SELECT (item->>'product_id')::UUID FROM jsonb_array_elements(p_items) AS item
  )
  ORDER BY p.id
  FOR UPDATE;

  -- First undo the original order's stock impact, recording each reversal.
  FOR v_old_item IN
    SELECT product_id, SUM(quantity)::INTEGER AS quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_old_item.product_id;
    v_previous_stock := v_product.stock_quantity;

    UPDATE public.products
    SET stock_quantity = stock_quantity + v_old_item.quantity
    WHERE id = v_old_item.product_id;

    INSERT INTO public.stock_history (
      product_id, change_type, quantity_changed, previous_stock, new_stock, reason
    ) VALUES (
      v_old_item.product_id,
      'increase',
      v_old_item.quantity,
      v_previous_stock,
      v_previous_stock + v_old_item.quantity,
      'Order ' || v_order.docket_number || ' edited (restore previous items)'
    );
  END LOOP;

  -- Cache one historic price per existing product before the old rows are
  -- replaced. Legacy duplicate rows are supported: they retain the first
  -- stored price for that product, matching the original create_order pricing.
  SELECT COALESCE(jsonb_object_agg(product_id::TEXT, price_at_purchase), '{}'::JSONB)
  INTO v_old_prices
  FROM (
    SELECT DISTINCT ON (product_id) product_id, price_at_purchase
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY product_id, id
  ) AS old_prices;

  DELETE FROM public.order_items WHERE order_id = p_order_id;

  -- Apply the replacement order after restoration. Any error here rolls back
  -- the item deletion, all stock changes, history rows, and order update.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF v_product.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %',
        v_product.name, v_product.stock_quantity, v_quantity;
    END IF;

    IF v_old_prices ? v_product_id::TEXT THEN
      v_price := (v_old_prices ->> v_product_id::TEXT)::NUMERIC(10,2);
    ELSE
      v_price := v_product.price;
    END IF;

    v_total := v_total + (v_price * v_quantity);
    v_previous_stock := v_product.stock_quantity;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (p_order_id, v_product_id, v_quantity, v_price);

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_product_id;

    INSERT INTO public.stock_history (
      product_id, change_type, quantity_changed, previous_stock, new_stock, reason
    ) VALUES (
      v_product_id,
      'decrease',
      v_quantity,
      v_previous_stock,
      v_previous_stock - v_quantity,
      'Order ' || p_docket_number || ' edited (apply updated items)'
    );
  END LOOP;

  UPDATE public.orders
  SET docket_number = p_docket_number,
      total_amount = v_total
  WHERE id = p_order_id;

  RETURN p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_order(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order(UUID, TEXT, JSONB) TO authenticated;

-- Direct order updates are also admin-only; the RPC above is the only path that
-- updates order items and inventory together.
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
CREATE POLICY "Admins can insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
