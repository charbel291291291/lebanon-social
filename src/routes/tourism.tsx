import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Mountain } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { RightRail } from "@/components/yalla/right-rail";
import { fetchTourismSpots, tourismQueryKey, type DbTourismSpot } from "@/lib/db";

export const Route = createFileRoute("/tourism")({
  head: () => ({
    meta: [
      { title: "Tourism & Travel — FaceLeb" },
      { name: "description", content: "Discover Lebanon's most beautiful places and attractions." },
      { property: "og:title", content: "Tourism & Travel — FaceLeb" },
      {
        property: "og:description",
        content: "Discover Lebanon's most beautiful places and attractions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lebanon-social-main.vercel.app/tourism" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://lebanon-social-main.vercel.app/tourism" }],
  }),
  component: TourismPage,
});

const CATEGORIES = ["All", "Historical", "Nature", "Religious", "Beach", "Cave", "Ski", "Cultural"];
const CAT_EMOJI: Record<string, string> = {
  Historical: "🏛️",
  Nature: "🌿",
  Religious: "⛪",
  Beach: "🏖️",
  Cave: "🪨",
  Ski: "🎿",
  Cultural: "🎨",
};
const CAT_GRADIENT: Record<string, string> = {
  Historical: "from-amber-400/20 to-orange-400/20",
  Nature: "from-green-400/20 to-emerald-300/20",
  Religious: "from-violet-400/20 to-purple-300/20",
  Beach: "from-cyan-400/20 to-blue-300/20",
  Cave: "from-slate-400/20 to-gray-400/20",
  Ski: "from-blue-200/30 to-sky-100/30",
  Cultural: "from-pink-400/20 to-rose-300/20",
};

function SpotCard({ spot }: { spot: DbTourismSpot }) {
  const emoji = CAT_EMOJI[spot.category] ?? "📍";
  const gradient = CAT_GRADIENT[spot.category] ?? "from-primary/10 to-accent/10";
  return (
    <article className="glass flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lift">
      {spot.image_url ? (
        <img
          src={spot.image_url}
          alt={spot.name}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={`flex h-44 items-center justify-center bg-gradient-to-br ${gradient} text-5xl`}
        >
          {emoji}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{spot.name}</p>
            {spot.is_featured && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
                ★ Must-see
              </span>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r ${gradient} border border-border/40`}
          >
            {emoji} {spot.category}
          </span>
        </div>
        {spot.description && (
          <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
            {spot.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          {spot.governorate && (
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="size-3" /> {spot.governorate}
            </span>
          )}
          {spot.address && <span className="truncate">{spot.address}</span>}
        </div>
      </div>
    </article>
  );
}

function TourismPage() {
  const [category, setCategory] = useState("All");

  const { data: spots = [], isLoading } = useQuery({
    queryKey: tourismQueryKey(category === "All" ? undefined : category),
    queryFn: () => fetchTourismSpots(category === "All" ? undefined : category),
  });

  const featured = spots.filter((s) => s.is_featured);
  const rest = spots.filter((s) => !s.is_featured);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Tourism & Travel 🇱🇧</h1>
            <p className="text-sm text-muted-foreground">
              Discover Lebanon's most beautiful places
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground shadow-lift"
                    : "glass border border-border/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {cat !== "All" && <span>{CAT_EMOJI[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass animate-pulse rounded-3xl h-72" />
              ))}
            </div>
          )}

          {!isLoading && spots.length === 0 && (
            <div className="glass rounded-3xl p-14 text-center space-y-3">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-green-400/15 text-green-600">
                <Mountain className="size-8" />
              </div>
              <p className="font-semibold text-lg">No spots found</p>
              <p className="text-sm text-muted-foreground">
                {category === "All"
                  ? "Tourism spots coming soon — check back shortly."
                  : `No ${category} spots found yet.`}
              </p>
            </div>
          )}

          {/* Featured spots */}
          {!isLoading && featured.length > 0 && category === "All" && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                ★ Must-see destinations
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured.map((s) => (
                  <SpotCard key={s.id} spot={s} />
                ))}
              </div>
            </div>
          )}

          {/* All / filtered */}
          {!isLoading && (category !== "All" ? spots : rest).length > 0 && (
            <div>
              {category === "All" && (
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  More to explore
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(category !== "All" ? spots : rest).map((s) => (
                  <SpotCard key={s.id} spot={s} />
                ))}
              </div>
            </div>
          )}
        </div>
        <RightRail />
      </main>
    </div>
  );
}
