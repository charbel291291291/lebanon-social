import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Clock3 } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { Stories } from "@/components/yalla/stories";
import { Composer } from "@/components/yalla/composer";
import { PostCard } from "@/components/yalla/post-card";
import { RightRail } from "@/components/yalla/right-rail";
import { posts } from "@/lib/yalla-data";

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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mode, setMode] = useState<"smart" | "recent">("smart");
  const list = mode === "smart" ? posts : [...posts].reverse();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
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

          {list.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}

          <p className="py-6 text-center text-xs text-muted-foreground">
            You're all caught up · يلا نكمل بكرا
          </p>
        </div>

        <RightRail />
      </main>
    </div>
  );
}
