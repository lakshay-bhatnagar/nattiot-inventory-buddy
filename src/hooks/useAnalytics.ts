import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      // Fetch orders with items
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select(`*, order_items(*, products(name, category, image_url))`)
        .eq("status", "completed");
      if (ordersErr) throw ordersErr;

      const totalRevenue = orders?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0;
      const totalOrders = orders?.length ?? 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Product-wise sales
      const productSales = new Map<string, { name: string; image_url: string | null; totalSold: number; revenue: number }>();
      const categorySales = new Map<string, number>();
      const monthlySales = new Map<string, number>();

      orders?.forEach((order) => {
        // Monthly
        const month = new Date(order.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
        monthlySales.set(month, (monthlySales.get(month) ?? 0) + Number(order.total_amount));

        order.order_items?.forEach((item: any) => {
          const pid = item.product_id;
          const existing = productSales.get(pid) ?? { name: item.products?.name ?? "Unknown", image_url: item.products?.image_url, totalSold: 0, revenue: 0 };
          existing.totalSold += item.quantity;
          existing.revenue += item.quantity * Number(item.price_at_purchase);
          productSales.set(pid, existing);

          const cat = item.products?.category ?? "Other";
          categorySales.set(cat, (categorySales.get(cat) ?? 0) + item.quantity * Number(item.price_at_purchase));
        });
      });

      const topSelling = Array.from(productSales.values()).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
      const categoryData = Array.from(categorySales.entries()).map(([name, value]) => ({ name, value }));
      const monthlyData = Array.from(monthlySales.entries()).map(([month, revenue]) => ({ month, revenue }));

      // Products stats
      const { data: products } = await supabase.from("products").select("id, stock_quantity");
      const productsInStock = products?.filter(p => p.stock_quantity > 0).length ?? 0;
      const totalProducts = products?.length ?? 0;

      return { totalRevenue, totalOrders, avgOrderValue, topSelling, categoryData, monthlyData, productsInStock, totalProducts };
    },
  });
}
