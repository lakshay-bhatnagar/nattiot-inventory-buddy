import { useAnalytics } from "@/hooks/useAnalytics";
import { useProducts } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["hsl(11, 23%, 61%)", "hsl(11, 23%, 75%)", "hsl(11, 23%, 48%)", "hsl(20, 15%, 65%)"];

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Sales insights and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Revenue Trend</h2>
          {data.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(11, 23%, 61%)" strokeWidth={2} dot={{ fill: "hsl(11, 23%, 61%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No sales data yet.</p>
          )}
        </motion.div>

        {/* Category Split */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Sales by Category</h2>
          {data.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No category data yet.</p>
          )}
        </motion.div>

        {/* Top Sellers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Top Selling Products</h2>
          {data.topSelling.length > 0 ? (
            <div className="space-y-3">
              {data.topSelling.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">#{i + 1}</span>
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                  </div>
                  <span className="text-sm tabular-nums font-medium">{p.totalSold} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No sales yet.</p>
          )}
        </motion.div>

        {/* Revenue Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Revenue Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-lg font-bold tabular-nums">${data.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="text-lg font-bold tabular-nums">${data.avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-lg font-bold tabular-nums">{data.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-muted-foreground">Products in Stock</span>
              <span className="text-lg font-bold tabular-nums">{data.productsInStock}/{data.totalProducts}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
