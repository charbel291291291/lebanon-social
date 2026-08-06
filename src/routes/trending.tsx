import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Hash } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { fetchTrends, trendsQueryKey, type DbTrend } from "@/lib/db";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Trending — FaceLeb" },
      { name: "description", content: "What's trending in Lebanon right now." },
    ],
  }),
  component: TrendingPage,
});

function TrendCard({ trend, rank }: { trend: DbTrend; rank: number }) {
  return (
    <button className="glass flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-all hover:ring-2 hover:ring-primary/20">
      <span className="w-6 shrink-0 text-sm font-bold text-muted-foreground">
        {rank}
      </span>
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
        <Hash className="size-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-primary">{trend.tag}</p>
        <p className="text-xs text-muted-foreground">
          {trend.post_count.toLocaleString()} posts
        </p>
      </div>
      <Flame className="size-4 text-gold" />
    </button>
  );
}

function TrendingPage() {
  const { data: trends = [], isLoading } = useQuery({
    queryKey: trendsQueryKey(),
    queryFn: fetchTrends,
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-5">
          <h1 className="text-2xl font-bold">Trending in Lebanon 🔥</h1>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass animate-pulse rounded-3xl p-4 h-16" />
              ))}
            </div>
          )}
          {!isLoading && trends.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center">
              <p className="text-3xl">🔥</p>
              <p className="mt-3 font-semibold">Nothing trending yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Trends will appear here once people start posting.
              </p>
            </div>
          )}
          {trends.length > 0 && (
            <div className="space-y-3">
              {trends.map((t, i) => (
                <TrendCard key={t.id} trend={t} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
