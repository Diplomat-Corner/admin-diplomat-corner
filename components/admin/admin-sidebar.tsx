"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";
import {
  Archive,
  BarChart3,
  Car,
  ChevronLeft,
  CreditCard,
  FolderCode,
  Home,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Package,
  MessageCircle,
  MessageSquareWarning,
  UserCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useAdminCheck } from "@/lib/hooks/use-admin-check";

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const { user } = useUser();
  const { isAdmin, userDetails } = useAdminCheck();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen bg-white transition-all duration-300 z-50 border-r flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          {isOpen && (
            <span className="text-lg font-bold text-diplomat-green">
              Diplomat Corner
            </span>
          )}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggle}>
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="space-y-1 py-4 overflow-y-auto overscroll-contain flex-1">
        <NavItem
          href="/"
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          isActive={pathname === "/"}
          isOpen={isOpen}
        />
        <NavItem
          href="/products"
          icon={<Package className="h-5 w-5" />}
          label="Products"
          isActive={pathname.startsWith("/products")}
          isOpen={isOpen}
        />
        <NavItem
          href="/products/houses"
          icon={<Home className="h-5 w-5" />}
          label="Houses"
          isActive={pathname === "/products/houses"}
          isOpen={isOpen}
          indent
        />
        <NavItem
          href="/products/cars"
          icon={<Car className="h-5 w-5" />}
          label="Cars"
          isActive={pathname === "/products/cars"}
          isOpen={isOpen}
          indent
        />
        <NavItem
          href="/advertisements"
          icon={<ImageIcon className="h-5 w-5" />}
          label="Advertisements"
          isActive={pathname.startsWith("/advertisements")}
          isOpen={isOpen}
        />
        <NavItem
          href="/users"
          icon={<Users className="h-5 w-5" />}
          label="Users"
          isActive={pathname === "/users"}
          isOpen={isOpen}
        />
        <NavItem
          href="/backup"
          icon={<Archive className="h-5 w-5" />}
          label="Backup"
          isActive={pathname === "/backup"}
          isOpen={isOpen}
        />
        <NavItem
          href="/payments"
          icon={<CreditCard className="h-5 w-5" />}
          label="Payments"
          isActive={pathname === "/payments"}
          isOpen={isOpen}
        />
        <NavItem
          href="/reports"
          icon={<MessageSquareWarning className="h-5 w-5" />}
          label="Reports"
          isActive={pathname === "/reports"}
          isOpen={isOpen}
        />
        <NavItem
          href="/messages"
          icon={<MessageCircle className="h-5 w-5" />}
          label="Messages"
          isActive={pathname.startsWith("/messages")}
          isOpen={isOpen}
        />
      </div>

      {/* User Profile Section */}
      <div className="mt-auto border-t p-4">
        <div
          className={cn(
            "flex items-center",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          {isOpen && user && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {user.fullName || user.username}
              </span>
              <span className="text-xs text-gray-500">
                {userDetails?.role || "User"}
              </span>
            </div>
          )}
          <UserButton />
        </div>

        {isOpen && (
          <div className="flex items-center gap-4 mt-4">
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-gray-500 hover:text-diplomat-green transition-colors"
            >
              <FolderCode className="h-4 w-4 text-diplomat-green group-hover:scale-110 transition-transform" />
              <span>Developed By Sydek</span>
            </Link>
            <Link
              href="https://sydek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Image
                src="/images/sydek-logo.png"
                alt="sydek logo"
                width={30}
                height={30}
                className="rounded-lg opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  indent?: boolean;
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  isOpen,
  indent = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 transition-colors",
        isActive
          ? "bg-diplomat-lightGreen text-diplomat-green font-medium"
          : "text-gray-600 hover:bg-gray-100",
        indent && isOpen && "pl-8",
        !isOpen && "justify-center"
      )}
    >
      <span>{icon}</span>
      {isOpen && <span>{label}</span>}
    </Link>
  );
}
