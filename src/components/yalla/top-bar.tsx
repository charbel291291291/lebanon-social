import { useState } from "react";
import {
  Bell,
  Search,
  Menu,
  Home,
  Users,
  CalendarDays,
  Store,
  Building2,
  UtensilsCrossed,
  Mountain,
  Flame,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { FaceLebIcon } from "./faceleb-icon";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getInitials } from "@/lib/db";

const NAV_ITEMS = [
  { icon: Home, label: "Feed", to: "/" },
  { icon: Users, label: "Communities", to: "/communities" },
  { icon: CalendarDays, label: "Events", to: "/events" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: Building2, label: "Businesses", to: "/businesses" },
  { icon: UtensilsCrossed, label: "Food", to: "/food" },
  { icon: Mountain, label: "Tourism", to: "/tourism" },
  { icon: Flame, label: "Trending", to: "/trending" },
  { icon: Search, label: "Search", to: "/search" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;

export function TopBar({ initialQuery }: { initialQuery?: string | undefined } = {}) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data as { full_name: string; avatar_url: string | null } | null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const displayName =
    profile?.full_name || (user?.user_metadata?.["full_name"] as string) || user?.email || "";
  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.["avatar_url"] as string) || null;
  return (
    <header className="sticky top-0 z-50 glass rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <FaceLebIcon className="size-10 shrink-0 drop-shadow-sm" />
          <span
            className="hidden font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight sm:block"
            aria-label="FaceLeb"
          >
            <span aria-hidden style={{ color: "#1A4BFF" }}>
              Face
            </span>
            <span aria-hidden style={{ color: "#EE0000" }}>
              Leb
            </span>
          </span>
        </Link>

        <form
          role="search"
          aria-label="Search FaceLeb"
          className="relative mx-auto w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchQuery.trim();
            if (q.length >= 2) navigate({ to: "/search", search: { q } });
          }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, places, groups, hashtags…"
            aria-label="Search FaceLeb"
            className="h-11 rounded-full border-border/60 bg-background/60 pl-10 backdrop-blur"
          />
        </form>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label="Notifications"
            onClick={() => toast.info("Notifications coming soon!")}
          >
            <Bell className="size-5" />
          </Button>
          <ThemeToggle />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle asChild>
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <FaceLebIcon className="size-8 shrink-0" />
                    <span
                      className="font-[family-name:var(--font-display)] text-lg font-extrabold"
                      aria-label="FaceLeb"
                    >
                      <span style={{ color: "#1A4BFF" }}>Face</span>
                      <span style={{ color: "#EE0000" }}>Leb</span>
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 px-2 pb-4">
                {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10 data-[status=active]:bg-primary/12 data-[status=active]:text-primary"
                  >
                    <Icon className="size-5 shrink-0" />
                    {label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    to="/auth"
                    search={{ next: undefined }}
                    onClick={() => setMenuOpen(false)}
                    className="mt-3 flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Sign in to FaceLeb
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {user ? (
            <Link to="/settings" aria-label="Your profile">
              <Avatar className="ml-1 size-9 ring-2 ring-gold/60">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button asChild size="sm" className="ml-1 rounded-full">
              <Link to="/auth" search={{ next: undefined }}>
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
