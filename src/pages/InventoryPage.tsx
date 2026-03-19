import { useState } from "react";
import { mockProducts, Product } from "@/data/mockData";
import { StockBadge } from "@/components/StockBadge";
import { Search, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const categories = ["All", ...Array.from(new Set(mockProducts.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Product removed from inventory");
  };

  const handleSaveEdit = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditProduct(null);
    toast.success("Product updated");
  };

  const handleAdd = (product: Omit<Product, "id" | "createdAt">) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    setIsAddOpen(false);
    toast.success("Product added to inventory");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} products · {products.reduce((s, p) => s + p.stock, 0)} total units</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground hover:brightness-95 shadow-sm gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-card shadow-card text-muted-foreground hover:text-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left py-3 px-5 font-medium">Product</th>
                <th className="text-left py-3 px-5 font-medium">SKU</th>
                <th className="text-left py-3 px-5 font-medium">Category</th>
                <th className="text-right py-3 px-5 font-medium">Price</th>
                <th className="text-right py-3 px-5 font-medium">Stock</th>
                <th className="text-left py-3 px-5 font-medium">Status</th>
                <th className="text-right py-3 px-5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-5 text-muted-foreground">{product.category}</td>
                    <td className="py-3 px-5 text-right tabular-nums">${product.price.toFixed(2)}</td>
                    <td className="py-3 px-5 text-right tabular-nums font-medium">{product.stock}</td>
                    <td className="py-3 px-5"><StockBadge stock={product.stock} threshold={product.threshold} /></td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditProduct(product)} className="p-1.5 hover:bg-card rounded-md shadow-sm transition-colors">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-status-danger-bg rounded-md transition-colors">
                          <Trash2 className="h-3.5 w-3.5 text-status-danger" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No rugs found. Start by adding your first product.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <ProductDialog
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={handleSaveEdit}
        mode="edit"
      />

      {/* Add Dialog */}
      <ProductDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(p) => handleAdd(p as Omit<Product, "id" | "createdAt">)}
        mode="add"
      />
    </div>
  );
}

function ProductDialog({ product, open, onClose, onSave, mode }: {
  product?: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<Partial<Product>>(
    product || { name: "", sku: "", category: "Rugs", price: 0, stock: 0, threshold: 10, image: "" }
  );

  // Sync when product changes
  if (mode === "edit" && product && form.id !== product.id) {
    setForm(product);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Product" : "Edit Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SKU</Label><Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Price</Label><Input type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock || 0} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
            <div><Label>Threshold</Label><Input type="number" value={form.threshold || 10} onChange={(e) => setForm({ ...form, threshold: +e.target.value })} /></div>
          </div>
          <div><Label>Image URL</Label><Input value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} className="bg-primary text-primary-foreground hover:brightness-95">
            {mode === "add" ? "Add Product" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
