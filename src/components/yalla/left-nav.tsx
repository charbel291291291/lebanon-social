import {
  Home,
  Users,
  CalendarDays,
  Store,
  Building2,
  UtensilsCrossed,
  Mountain,
  Flame,
  MapPinned,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { governorates } from "@/lib/yalla-data";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/db";

const feedItems = [
  { icon: Home, label: "Feed", to: "/" as const },
];

const sectionItems = [
  { icon: Users, label: "Communities" },
  { icon: CalendarDays, label: "Events" },
  { icon: Store, label: "Marketplace" },
  { icon: Building2, label: "Businesses" },
  { icon: UtensilsCrossed, label: "Food" },
  { icon: Mountain, label: "Tourism" },
  { icon: Flame, label: "Trending" },
];

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
      return data as { id: string; full_name: string; username: string; avatar_url: string | null } | null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name as string | undefined ||
    user?.email?.split("@")[0] ||
    "My Profile";

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null;

  return (
    <nav
      className="sticky top-20 hidden h-fit w-64 shrink-0 flex-col gap-4 lg:flex"
      aria-label="Primary"
    >
      {/* Profile card */}
      {user ? (
        <Link
          to={profile?.username ? `/u/${profile.username}` : "/settings"}
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
            {profile?.username ? (
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            ) : (
              <p className="text-xs text-muted-foreground">View profile →</p>
            )}
          </div>
        </Link>
      ) : (
        <Link
          to="/auth"
          className="glass flex items-center justify-center rounded-3xl p-4 text-sm font-semibold text-primary transition-all hover:ring-2 hover:ring-primary/20"
        >
          Sign in to FaceLeb
        </Link>
      )}

      {/* Navigation */}
      <div className="glass rounded-3xl p-2">
        {/* Feed — real route, gets active styling */}
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={`${LINK_BASE} text-foreground/80 data-[status=active]:bg-primary/12 data-[status=active]:text-primary`}
        >
          <Home className="size-5" />
          Feed
        </Link>

        {/* Section items — no dedicated routes yet, styled as nav buttons */}
        {sectionItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className={`${LINK_BASE} text-foreground/80`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}

        {/* Settings — real route */}
        <Link
          to="/settings"
          activeOptions={{ exact: true }}
          className={`${LINK_BASE} text-foreground/80 data-[status=active]:bg-primary/12 data-[status=active]:text-primary`}
        >
          <Settings className="size-5" />
          Settings
        </Link>
      </div>

      {/* Governorates */}
      <div className="glass rounded-3xl p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MapPinned className="size-4" /> Explore by governorate
        </p>
        <div className="flex flex-wrap gap-2">
          {governorates.map((g) => (
            <button
              key={g}
              className="rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
