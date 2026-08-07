import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Clock3, Store, Building2, UtensilsCrossed, Mountain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { Stories } from "@/components/yalla/stories";
import { Composer } from "@/components/yalla/composer";
import { PostCard } from "@/components/yalla/post-card";
import { RightRail } from "@/components/yalla/right-rail";
import { fetchPosts, postsQueryKey } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

const title = "FaceLeb — Lebanon's Social Network";
const description =
  "FaceLeb connects Lebanon through neighborhoods, universities, villages, food, events and local businesses. Share stories, join communities, discover what's trending.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://faceleb.vercel.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://faceleb.vercel.app/" }],
  }),
  component: Index,
});

function PostSkeleton() {
  return (
    <div className="glass animate-pulse rounded-3xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="size-11 rounded-full bg-muted" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}

function Index() {
  const [mode, setMode] = useState<"smart" | "recent">("smart");
  const { user } = useAuth();

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: postsQueryKey(user?.id),
    queryFn: () => fetchPosts(user?.id),
  });

  const list = mode === "smart" ? posts : [...posts].reverse();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />

        <div className="mx-auto w-full max-w-2xl space-y-4">
          <h1 className="sr-only">FaceLeb — Lebanon's community feed</h1>

          <Stories />
          <Composer />

          <div className="glass flex items-center gap-1 rounded-full p-1">
            {(
              [
                { key: "smart", label: "Smart feed", icon: Sparkles },
                { key: "recent", label: "Most recent", icon: Clock3 },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-all ${
                  mode === key
                    ? "bg-primary text-primary-foreground shadow-lift"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {isLoading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {isError && (
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Couldn't load posts. Try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !isError && list.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center space-y-3">
              <p className="text-3xl">🇱🇧</p>
              <p className="font-semibold text-lg">Lebanon's social network</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Connect with your neighborhood, university, and city. Share posts, discover local
                businesses, events, and food.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {[
                  { to: "/marketplace", icon: Store, label: "Marketplace" },
                  { to: "/businesses", icon: Building2, label: "Businesses" },
                  { to: "/food", icon: UtensilsCrossed, label: "Food" },
                  { to: "/tourism", icon: Mountain, label: "Tourism" },
                ].map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {list.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}

          {!isLoading && list.length > 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              You're all caught up · يلا نكمل بكرا
            </p>
          )}

          {/* Mobile discovery — mirrors right rail, visible below xl breakpoint */}
          <div className="xl:hidden">
            <RightRail inline />
          </div>
        </div>

        <RightRail />
      </main>
    </div>
  );
}
