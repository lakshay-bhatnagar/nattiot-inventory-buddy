import { useState } from "react";
import { useEffect } from 'react';
// import { useOrders, useCreateOrder, OrderWithItems } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
// import { Plus, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, Search, Eye, Trash2 } from "lucide-react"; // Add Trash2
import { useOrders, useCreateOrder, useDeleteOrder, useUpdateOrderStatus, OrderWithItems } from "@/hooks/useOrders";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { role } = useAuth(); // 1. Get the role
  const isAdmin = role === 'admin';
  const deleteOrder = useDeleteOrder();
  const updateStatus = useUpdateOrderStatus();
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<OrderWithItems | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = orders.filter(o =>
    o.docket_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} orders</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground hover:brightness-95 shadow-sm gap-2">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by docket number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground"><p className="text-sm">Loading orders...</p></div>
        ) : (
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
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="group border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-5 font-medium">{order.docket_number}</td>
                    <td className="py-3 px-5 text-muted-foreground">
                      {order.order_items.map(i => i.products?.name).filter(Boolean).join(", ")}
                    </td>
                    <td className="py-3 px-5 text-right tabular-nums font-medium">₹{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-5 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-5">
                      {isAdmin ? (
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                          className={`text-xs font-medium px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-primary cursor-pointer
                            ${order.status === "completed" ? "bg-status-success-bg text-status-success" :
                              order.status === "pending" ? "bg-status-warning-bg text-status-warning" :
                                "bg-status-danger-bg text-status-danger"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "completed" ? "bg-status-success-bg text-status-success" : order.status === "pending" ? "bg-status-warning-bg text-status-warning" : "bg-status-danger-bg text-status-danger"}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-5 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="p-1.5 hover:bg-card rounded-md shadow-sm transition-opacity"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this order? This cannot be undone.")) {
                              deleteOrder.mutate(order.id);
                            }
                          }}
                          className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => setViewOrder(order)} className="p-1.5 hover:bg-card rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Order */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order {viewOrder?.docket_number}</DialogTitle></DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{new Date(viewOrder.created_at).toLocaleString()}</p>
              <div className="space-y-2">
                {viewOrder.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border/50">
                    <span>{item.products?.name ?? "Unknown"} × {item.quantity}</span>
                    <span className="tabular-nums">₹{(Number(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold pt-2">
                <span>Total</span>
                <span className="tabular-nums">₹{Number(viewOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isCreateOpen && <CreateOrderDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />}
    </div>
  );
}

function CreateOrderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: products = [] } = useProducts();
  const createOrder = useCreateOrder();
  const [docket, setDocket] = useState("");
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([]);

  // Correctly initialize state using useEffect to avoid render-phase updates
  useEffect(() => {
    if (items.length === 0 && products.length > 0) {
      setItems([{ product_id: products[0].id, quantity: 1 }]);
    }
  }, [products]);

  const addItem = () => {
    if (products.length > 0) {
      setItems(prev => [...prev, { product_id: products[0].id, quantity: 1 }]);
    }
  };

  const handleSave = () => {
    createOrder.mutate({
      docketNumber: docket || `DOC-${Date.now()}`,
      items,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Explicitly set a width and prevent horizontal overflow */}
      <DialogContent className="sm:max-w-[500px] w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="docket">Docket Number</Label>
            <Input
              id="docket"
              value={docket}
              onChange={(e) => setDocket(e.target.value)}
              placeholder="DOC-2024-006"
              className="w-full" // Ensure full width
            />
          </div>

          <div className="space-y-3">
            <Label>Products</Label>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3"> {/* Added scroll for many items */}
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={item.product_id}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].product_id = e.target.value;
                      setItems(newItems);
                    }}
                    className="flex-1 min-w-0 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{Number(p.price).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].quantity = +e.target.value;
                      setItems(newItems);
                    }}
                    className="w-20 shrink-0" // Prevent the quantity box from shrinking
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={createOrder.isPending}
            className="bg-primary"
          >
            {createOrder.isPending ? "Creating..." : "Complete Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}