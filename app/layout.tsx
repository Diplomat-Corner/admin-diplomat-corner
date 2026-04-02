import "@/lib/ensure-localStorage-polyfill-init";

import type React from "react";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "sonner";
import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import QueryProvider from "@/components/providers/query-provider";

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
    <ClerkProvider>
      <html className={inter.className}>
        <body>
          <QueryProvider>
            <ToastProvider>
              {children}
              <Toaster richColors position="top-right" />
            </ToastProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
