import { cn } from "@/lib/utils";

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

function getStatus(stock: number, threshold: number): StockStatus {
  if (stock === 0) return "out-of-stock";
  if (stock <= threshold) return "low-stock";
  return "in-stock";
}

const labels: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const status = getStatus(stock, threshold);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        status === "in-stock" && "bg-status-success-bg text-status-success",
        status === "low-stock" && "bg-status-warning-bg text-status-warning",
        status === "out-of-stock" && "bg-status-danger-bg text-status-danger"
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "in-stock" && "bg-status-success",
        status === "low-stock" && "bg-status-warning",
        status === "out-of-stock" && "bg-status-danger"
      )} />
      {labels[status]}
    </span>
  );
}
