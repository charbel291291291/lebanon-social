import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Users2,
  CalendarDays,
  ShoppingBag,
  Building2,
  UtensilsCrossed,
  Mountain,
  TrendingUp,
  Shield,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { adminCheckAccess } from "@/lib/admin-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      await adminCheckAccess();
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const NAV = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/admin" }],
  },
  {
    label: "Content",
    items: [
      { icon: Users, label: "Users", to: "/admin/users" },
      { icon: FileText, label: "Posts", to: "/admin/posts" },
      { icon: MessageSquare, label: "Comments", to: "/admin/comments" },
    ],
  },
  {
    label: "Platform",
    items: [
      { icon: Users2, label: "Communities", to: "/admin/communities" },
      { icon: CalendarDays, label: "Events", to: "/admin/events" },
      { icon: ShoppingBag, label: "Marketplace", to: "/admin/marketplace" },
    ],
  },
  {
    label: "Directory",
    items: [
      { icon: Building2, label: "Businesses", to: "/admin/businesses" },
      { icon: UtensilsCrossed, label: "Food Places", to: "/admin/food" },
      { icon: Mountain, label: "Tourism Spots", to: "/admin/tourism" },
      { icon: TrendingUp, label: "Trends", to: "/admin/trends" },
    ],
  },
] as const;

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border/60 bg-background">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="size-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none">FaceLeb</p>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-md p-1 hover:bg-accent">
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            {section.items.map(({ icon: Icon, label, to }) => {
              const isActive =
                to === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 px-2 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to FaceLeb
        </Link>
      </div>
    </aside>
  );
}

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-background px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
