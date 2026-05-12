import type React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarProvider } from "@/components/admin/sidebar-provider";
import { ToastProvider } from "@/components/ui/toast";
import "../globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import AdminProtected from "@/components/admin/admin-protected";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diplomat Corner",
  description: "Diplomat Corner - Your trusted marketplace",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <AdminProtected redirectToPermissionDenied={true}>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex min-h-0 flex-1 flex-col bg-white">{children}</div>
          </div>
        </SidebarProvider>
      </AdminProtected>
    </ToastProvider>
  );
}
