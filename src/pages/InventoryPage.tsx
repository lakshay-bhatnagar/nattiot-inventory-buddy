import { useState } from "react";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateStock, Product } from "@/hooks/useProducts";
import { StockBadge } from "@/components/StockBadge";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InventoryPage() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} products · {products.reduce((s, p) => s + p.stock_quantity, 0)} total units
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground hover:brightness-95 shadow-sm gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-card shadow-card text-muted-foreground hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground"><p className="text-sm">Loading products...</p></div>
        ) : (
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
                    <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="group border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          {product.image_url && <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover outline outline-1 outline-foreground/5 -outline-offset-1" />}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{product.sku || "—"}</td>
                      <td className="py-3 px-5 text-muted-foreground">{product.category || "—"}</td>
                      <td className="py-3 px-5 text-right tabular-nums">${Number(product.price).toFixed(2)}</td>
                      <td className="py-3 px-5 text-right tabular-nums font-medium">{product.stock_quantity}</td>
                      <td className="py-3 px-5"><StockBadge stock={product.stock_quantity} threshold={product.threshold} /></td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditProduct(product)} className="p-1.5 hover:bg-card rounded-md shadow-sm transition-colors">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteProduct.mutate(product.id)} className="p-1.5 hover:bg-status-danger-bg rounded-md transition-colors">
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
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No products found. Start by adding your first product.</p>
          </div>
        )}
      </div>

      {editProduct && (
        <ProductDialog
          product={editProduct}
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(form) => {
            updateProduct.mutate({ id: editProduct.id, ...form });
            setEditProduct(null);
          }}
          mode="edit"
        />
      )}

      <ProductDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(form) => {
          createProduct.mutate(form as any);
          setIsAddOpen(false);
        }}
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
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "Rugs",
    price: product?.price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    threshold: product?.threshold ?? 10,
    image_url: product?.image_url ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async () => {
    if (!imageFile) return form.image_url;
    setUploading(true);
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
    setUploading(false);
    if (error) { toast.error("Image upload failed"); return form.image_url; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    return publicUrl;
  };

  const handleSave = async () => {
    const imageUrl = await handleImageUpload();
    onSave({ ...form, image_url: imageUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Product" : "Edit Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: +e.target.value })} /></div>
            <div><Label>Threshold</Label><Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: +e.target.value })} /></div>
          </div>
          <div>
            <Label>Product Image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            {form.image_url && !imageFile && (
              <img src={form.image_url} alt="Preview" className="mt-2 w-16 h-16 rounded-md object-cover" />
            )}
          </div>
          <div><Label>Or Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={uploading} className="bg-primary text-primary-foreground hover:brightness-95">
            {uploading ? "Uploading..." : mode === "add" ? "Add Product" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
