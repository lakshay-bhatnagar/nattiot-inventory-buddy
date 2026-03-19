
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===================== PROFILES =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== USER ROLES =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ===================== PRODUCTS =====================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sku ON public.products(sku);

-- ===================== ORDERS =====================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docket_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_orders_docket ON public.orders(docket_number);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ===================== ORDER ITEMS =====================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(10,2) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ===================== STOCK HISTORY =====================
CREATE TABLE public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('increase', 'decrease', 'adjustment')),
  quantity_changed INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock history" ON public.stock_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock history" ON public.stock_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_stock_history_product ON public.stock_history(product_id);

-- ===================== CREATE ORDER FUNCTION =====================
CREATE OR REPLACE FUNCTION public.create_order(
  p_docket_number TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(10,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_quantity INTEGER;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;
    
    IF v_product.stock_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %', v_product.name, v_product.stock_quantity, v_quantity;
    END IF;
    
    v_total := v_total + (v_product.price * v_quantity);
  END LOOP;

  INSERT INTO public.orders (docket_number, total_amount, status)
  VALUES (p_docket_number, v_total, 'completed')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (v_order_id, v_product.id, v_quantity, v_product.price);

    UPDATE public.products SET stock_quantity = stock_quantity - v_quantity WHERE id = v_product.id;

    INSERT INTO public.stock_history (product_id, change_type, quantity_changed, previous_stock, new_stock, reason)
    VALUES (v_product.id, 'decrease', v_quantity, v_product.stock_quantity, v_product.stock_quantity - v_quantity, 'Order ' || p_docket_number);
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- ===================== STORAGE =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
