import {
  Home,
  Users,
  CalendarDays,
  Store,
  Building2,
  UtensilsCrossed,
  Mountain,
  Flame,
  Search,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/db";

const navItems = [
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

const LINK_BASE =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-primary/10";

export function LeftNav() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data as {
        id: string;
        full_name: string;
        username: string;
        avatar_url: string | null;
      } | null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email?.split("@")[0] ||
    "My Profile";

  const avatarUrl =
    profile?.avatar_url || (user?.user_metadata?.["avatar_url"] as string | undefined) || null;

  return (
    <nav
      className="sticky top-20 hidden h-fit w-64 shrink-0 flex-col gap-4 lg:flex"
      aria-label="Primary"
    >
      {/* Profile card */}
      {user ? (
        profile?.username ? (
          <Link
            to="/u/$username"
            params={{ username: profile.username }}
            className="glass flex items-center gap-3 rounded-3xl p-4 transition-all hover:ring-2 hover:ring-primary/20"
          >
            <Avatar className="size-12 shrink-0 ring-2 ring-primary/30">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            </div>
          </Link>
        ) : (
          <Link
            to="/settings"
            className="glass flex items-center gap-3 rounded-3xl p-4 transition-all hover:ring-2 hover:ring-primary/20"
          >
            <Avatar className="size-12 shrink-0 ring-2 ring-primary/30">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">View profile →</p>
            </div>
          </Link>
        )
      ) : (
        <Link
          to="/auth"
          search={{ next: undefined }}
          className="glass flex items-center justify-center rounded-3xl p-4 text-sm font-semibold text-primary transition-all hover:ring-2 hover:ring-primary/20"
        >
          Sign in to FaceLeb
        </Link>
      )}

      {/* Navigation */}
      <div className="glass rounded-3xl p-2">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            activeOptions={to === "/" ? { exact: true } : { exact: true }}
            className={`${LINK_BASE} text-foreground/80 data-[status=active]:bg-primary/12 data-[status=active]:text-primary`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
