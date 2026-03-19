import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex w-full bg-surface">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
