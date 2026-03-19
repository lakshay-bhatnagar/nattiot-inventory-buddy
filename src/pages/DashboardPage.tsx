import { StatCard } from "@/components/StatCard";
import { StockBadge } from "@/components/StockBadge";
import { mockProducts, mockOrders, mockSalesData } from "@/data/mockData";
import { DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const lowStockItems = mockProducts.filter(p => p.stock <= p.threshold);
const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
const totalProducts = mockProducts.length;
const totalOrders = mockOrders.length;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend={{ value: "12% vs last month", positive: true }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard title="Total Products" value={totalProducts.toString()} icon={Package} subtitle="Across 4 categories" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Orders" value={totalOrders.toString()} icon={ShoppingCart} trend={{ value: "3 new this week", positive: true }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard title="Low Stock Alerts" value={lowStockItems.length.toString()} icon={AlertTriangle} subtitle="Items need restocking" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
              <Bar dataKey="revenue" fill="hsl(11, 23%, 61%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Low Stock */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Low Stock Items</h2>
          <div className="space-y-3">
            {lowStockItems.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <StockBadge stock={product.stock} threshold={product.threshold} />
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-sm text-muted-foreground">All items are well stocked.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
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
              {mockOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-5 font-medium">{order.docketNumber}</td>
                  <td className="py-3 px-5 text-muted-foreground">{order.items.length} item(s)</td>
                  <td className="py-3 px-5 tabular-nums">${order.total.toFixed(2)}</td>
                  <td className="py-3 px-5 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "completed" ? "bg-status-success-bg text-status-success" : order.status === "pending" ? "bg-status-warning-bg text-status-warning" : "bg-status-danger-bg text-status-danger"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
