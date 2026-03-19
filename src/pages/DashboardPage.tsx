import { StatCard } from "@/components/StatCard";
import { StockBadge } from "@/components/StockBadge";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const { data: analytics } = useAnalytics();

  const lowStockItems = products.filter(p => p.stock_quantity <= p.threshold);
  const totalRevenue = analytics?.totalRevenue ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard title="Total Products" value={products.length.toString()} icon={Package} subtitle={`${new Set(products.map(p => p.category).filter(Boolean)).size} categories`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Orders" value={orders.length.toString()} icon={ShoppingCart} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard title="Low Stock Alerts" value={lowStockItems.length.toString()} icon={AlertTriangle} subtitle="Items need restocking" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Monthly Revenue</h2>
          {analytics?.monthlyData && analytics.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
                <Bar dataKey="revenue" fill="hsl(11, 23%, 61%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No revenue data yet. Create some orders to see trends.</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Low Stock Items</h2>
          <div className="space-y-3">
            {lowStockItems.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                {product.image_url && <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <StockBadge stock={product.stock_quantity} threshold={product.threshold} />
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-sm text-muted-foreground">All items are well stocked.</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left py-3 px-5 font-medium">Docket</th>
                <th className="text-left py-3 px-5 font-medium">Items</th>
                <th className="text-left py-3 px-5 font-medium">Total</th>
                <th className="text-left py-3 px-5 font-medium">Date</th>
                <th className="text-left py-3 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-5 font-medium">{order.docket_number}</td>
                  <td className="py-3 px-5 text-muted-foreground">{order.order_items.length} item(s)</td>
                  <td className="py-3 px-5 tabular-nums">${Number(order.total_amount).toFixed(2)}</td>
                  <td className="py-3 px-5 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "completed" ? "bg-status-success-bg text-status-success" : order.status === "pending" ? "bg-status-warning-bg text-status-warning" : "bg-status-danger-bg text-status-danger"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
