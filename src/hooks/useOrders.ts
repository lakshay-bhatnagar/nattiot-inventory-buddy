import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderWithItems {
  id: string;
  docket_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    products: { name: string; image_url: string | null } | null;
  }[];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*, products(name, image_url))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docketNumber, items }: {
      docketNumber: string;
      items: { product_id: string; quantity: number }[];
    }) => {
      const { data, error } = await supabase.rpc("create_order", {
        p_docket_number: docketNumber,
        p_items: items,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Order created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
