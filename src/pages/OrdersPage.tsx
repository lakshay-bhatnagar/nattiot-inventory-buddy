import { useState } from "react";
import { mockOrders, mockProducts, Order, OrderItem } from "@/data/mockData";
import { Plus, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = orders.filter(o =>
    o.docketNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} orders</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground hover:brightness-95 shadow-sm gap-2">
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by docket number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left py-3 px-5 font-medium">Docket</th>
                <th className="text-left py-3 px-5 font-medium">Items</th>
                <th className="text-right py-3 px-5 font-medium">Total</th>
                <th className="text-left py-3 px-5 font-medium">Date</th>
                <th className="text-left py-3 px-5 font-medium">Status</th>
                <th className="text-right py-3 px-5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-5 font-medium">{order.docketNumber}</td>
                  <td className="py-3 px-5 text-muted-foreground">
                    {order.items.map(i => i.productName).join(", ")}
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums font-medium">${order.total.toFixed(2)}</td>
                  <td className="py-3 px-5 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "completed" ? "bg-status-success-bg text-status-success" : order.status === "pending" ? "bg-status-warning-bg text-status-warning" : "bg-status-danger-bg text-status-danger"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => setViewOrder(order)} className="p-1.5 hover:bg-card rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order {viewOrder?.docketNumber}</DialogTitle></DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{new Date(viewOrder.date).toLocaleString()}</p>
              <div className="space-y-2">
                {viewOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-border/50">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="tabular-nums">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold pt-2">
                <span>Total</span>
                <span className="tabular-nums">${viewOrder.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order */}
      <CreateOrderDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={(order) => {
        setOrders(prev => [order, ...prev]);
        setIsCreateOpen(false);
        toast.success("Order created");
      }} />
    </div>
  );
}

function CreateOrderDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (order: Order) => void }) {
  const [docket, setDocket] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: mockProducts[0].id, quantity: 1 }]);

  const addItem = () => setItems(prev => [...prev, { productId: mockProducts[0].id, quantity: 1 }]);

  const handleSave = () => {
    const orderItems: OrderItem[] = items.map(i => {
      const p = mockProducts.find(pr => pr.id === i.productId)!;
      return { productId: p.id, productName: p.name, quantity: i.quantity, unitPrice: p.price };
    });
    const total = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    onSave({
      id: Date.now().toString(),
      docketNumber: docket || `DOC-${Date.now()}`,
      items: orderItems,
      total,
      date: new Date().toISOString(),
      status: "completed",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Docket Number</Label><Input value={docket} onChange={(e) => setDocket(e.target.value)} placeholder="DOC-2024-006" /></div>
          <div className="space-y-3">
            <Label>Products</Label>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <select
                  value={item.productId}
                  onChange={(e) => { const newItems = [...items]; newItems[idx].productId = e.target.value; setItems(newItems); }}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                </select>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => { const newItems = [...items]; newItems[idx].quantity = +e.target.value; setItems(newItems); }} className="w-20" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:brightness-95">Complete Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
