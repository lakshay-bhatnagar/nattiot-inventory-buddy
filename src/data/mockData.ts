export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  image: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  docketNumber: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
}

export const mockProducts: Product[] = [
  { id: "1", name: "Rainbow Cloud Rug", sku: "NAT-RC-001", category: "Rugs", price: 89.00, stock: 45, threshold: 10, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop", createdAt: "2024-01-15" },
  { id: "2", name: "Safari Adventure Mat", sku: "NAT-SA-002", category: "Mats", price: 65.00, stock: 8, threshold: 10, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop", createdAt: "2024-02-01" },
  { id: "3", name: "Cotton Cloud Carpet", sku: "NAT-CC-003", category: "Carpets", price: 120.00, stock: 32, threshold: 15, image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=200&h=200&fit=crop", createdAt: "2024-02-10" },
  { id: "4", name: "Starry Night Runner", sku: "NAT-SN-004", category: "Runners", price: 75.00, stock: 0, threshold: 5, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop", createdAt: "2024-03-01" },
  { id: "5", name: "Ocean Waves Rug", sku: "NAT-OW-005", category: "Rugs", price: 95.00, stock: 22, threshold: 10, image: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=200&h=200&fit=crop", createdAt: "2024-03-15" },
  { id: "6", name: "Woodland Friends Mat", sku: "NAT-WF-006", category: "Mats", price: 55.00, stock: 3, threshold: 8, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop", createdAt: "2024-04-01" },
  { id: "7", name: "Garden Party Carpet", sku: "NAT-GP-007", category: "Carpets", price: 140.00, stock: 18, threshold: 10, image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&h=200&fit=crop", createdAt: "2024-04-15" },
  { id: "8", name: "Zigzag Play Rug", sku: "NAT-ZP-008", category: "Rugs", price: 70.00, stock: 50, threshold: 12, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop", createdAt: "2024-05-01" },
];

export const mockOrders: Order[] = [
  { id: "1", docketNumber: "DOC-2024-001", items: [{ productId: "1", productName: "Rainbow Cloud Rug", quantity: 2, unitPrice: 89.00 }, { productId: "3", productName: "Cotton Cloud Carpet", quantity: 1, unitPrice: 120.00 }], total: 298.00, date: "2024-06-01T10:30:00", status: "completed" },
  { id: "2", docketNumber: "DOC-2024-002", items: [{ productId: "5", productName: "Ocean Waves Rug", quantity: 3, unitPrice: 95.00 }], total: 285.00, date: "2024-06-02T14:15:00", status: "completed" },
  { id: "3", docketNumber: "DOC-2024-003", items: [{ productId: "7", productName: "Garden Party Carpet", quantity: 1, unitPrice: 140.00 }, { productId: "8", productName: "Zigzag Play Rug", quantity: 2, unitPrice: 70.00 }], total: 280.00, date: "2024-06-03T09:00:00", status: "pending" },
  { id: "4", docketNumber: "DOC-2024-004", items: [{ productId: "2", productName: "Safari Adventure Mat", quantity: 5, unitPrice: 65.00 }], total: 325.00, date: "2024-06-04T16:45:00", status: "completed" },
  { id: "5", docketNumber: "DOC-2024-005", items: [{ productId: "1", productName: "Rainbow Cloud Rug", quantity: 1, unitPrice: 89.00 }, { productId: "6", productName: "Woodland Friends Mat", quantity: 3, unitPrice: 55.00 }], total: 254.00, date: "2024-06-05T11:20:00", status: "completed" },
];

export const mockSalesData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 4900 },
  { month: "Apr", revenue: 7200 },
  { month: "May", revenue: 6100 },
  { month: "Jun", revenue: 8400 },
];

export const mockCategorySales = [
  { name: "Rugs", value: 45 },
  { name: "Carpets", value: 28 },
  { name: "Mats", value: 18 },
  { name: "Runners", value: 9 },
];
