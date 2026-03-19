import { mockSalesData, mockCategorySales, mockProducts, mockOrders } from "@/data/mockData";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["hsl(11, 23%, 61%)", "hsl(11, 23%, 75%)", "hsl(11, 23%, 48%)", "hsl(20, 15%, 65%)"];

const topSelling = mockProducts
  .map(p => {
    const totalSold = mockOrders.flatMap(o => o.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
    return { ...p, totalSold };
  })
  .sort((a, b) => b.totalSold - a.totalSold)
  .slice(0, 5);

const totalRevenue = mockOrders.reduce((s, o) => s + o.total, 0);

export default function AnalyticsPage() {
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
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(11, 23%, 61%)" strokeWidth={2} dot={{ fill: "hsl(11, 23%, 61%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Split */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={mockCategorySales} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {mockCategorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-card)" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Sellers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topSelling.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-5">#{i + 1}</span>
                <img src={p.image} alt={p.name} className="w-8 h-8 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                </div>
                <span className="text-sm tabular-nums font-medium">{p.totalSold} sold</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Revenue Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm mb-4">Revenue Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-lg font-bold tabular-nums">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="text-lg font-bold tabular-nums">${(totalRevenue / mockOrders.length).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-lg font-bold tabular-nums">{mockOrders.length}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-muted-foreground">Products in Stock</span>
              <span className="text-lg font-bold tabular-nums">{mockProducts.filter(p => p.stock > 0).length}/{mockProducts.length}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
