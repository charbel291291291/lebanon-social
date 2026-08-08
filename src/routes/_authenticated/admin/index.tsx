import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileText,
  MessageSquare,
  Users2,
  CalendarDays,
  ShoppingBag,
  Building2,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import { adminGetStats } from "@/lib/admin-fns";
import { relativeTime } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`flex size-8 items-center justify-center rounded-lg ${accent ?? "bg-primary/10"}`}>
          <Icon className={`size-4 ${accent ? "text-white" : "text-primary"}`} />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminGetStats(),
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
          <div className="mt-1 h-4 w-72 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of FaceLeb platform activity
        </p>
      </div>

      {/* KPI grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={s.totalUsers}
          sub={`+${s.newUsers} this week`}
        />
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={s.totalPosts}
          sub={`+${s.newPosts} this week`}
        />
        <StatCard
          icon={MessageSquare}
          label="Comments"
          value={s.totalComments}
        />
        <StatCard
          icon={Users2}
          label="Communities"
          value={s.totalCommunities}
        />
        <StatCard
          icon={CalendarDays}
          label="Events"
          value={s.totalEvents}
        />
        <StatCard
          icon={ShoppingBag}
          label="Active Listings"
          value={s.activeListings}
        />
        <StatCard
          icon={Building2}
          label="Verified Businesses"
          value={s.verifiedBiz}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="New Users (7d)"
          value={s.newUsers}
          accent="bg-blue-500"
        />
      </div>

      {/* Bottom panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent posts */}
        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <h2 className="mb-4 font-semibold">Recent Posts</h2>
          {s.recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {s.recentPosts.map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-none rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {p.tag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {(p.author as { username: string } | null)?.username ?? "—"} ·{" "}
                      {relativeTime(p.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New users */}
        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <h2 className="mb-4 font-semibold">Newest Members</h2>
          {s.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {s.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {(u.full_name || u.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {u.full_name || u.username}
                      </p>
                      {u.is_verified && (
                        <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                      )}
                      {u.is_admin && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{u.username} · {relativeTime(u.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
