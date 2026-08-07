import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UtensilsCrossed, MapPin, Phone } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { RightRail } from "@/components/yalla/right-rail";
import { fetchFoodPlaces, foodQueryKey, type DbFoodPlace } from "@/lib/db";

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food & Restaurants — FaceLeb" },
      { name: "description", content: "Discover the best restaurants and food places in Lebanon." },
      { property: "og:title", content: "Food & Restaurants — FaceLeb" },
      {
        property: "og:description",
        content: "Discover the best restaurants and food places in Lebanon.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://faceleb.vercel.app/food" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://faceleb.vercel.app/food" }],
  }),
  component: FoodPage,
});

const CUISINES = [
  "All",
  "Lebanese",
  "Armenian",
  "Mediterranean",
  "Street Food",
  "Seafood",
  "Japanese",
  "Coffee & Cafés",
  "International",
];
const CUISINE_EMOJI: Record<string, string> = {
  Lebanese: "🫙",
  Armenian: "🥘",
  Mediterranean: "🐟",
  "Street Food": "🌯",
  Seafood: "🦞",
  Japanese: "🍣",
  "Coffee & Cafés": "☕",
  International: "🌍",
};
const PRICE_COLOR: Record<string, string> = {
  $: "text-green-600",
  $$: "text-amber-600",
  $$$: "text-red-500",
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        className={filled ? "fill-gold stroke-gold" : "fill-none stroke-muted-foreground"}
        strokeWidth={filled ? 0 : 1.5}
      />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span className="flex items-center gap-1">
      <span
        className="flex items-center gap-0.5"
        aria-label={`${rating.toFixed(1)} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < full} />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

function FoodCard({ place }: { place: DbFoodPlace }) {
  const emoji = CUISINE_EMOJI[place.cuisine] ?? "🍽️";
  return (
    <article className="glass flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lift">
      {place.image_url ? (
        <img
          src={place.image_url}
          alt={place.name}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-orange-400/15 to-red-400/15 text-5xl">
          {emoji}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{place.name}</p>
            {place.is_featured && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold">
                ⭐ Featured
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              {emoji} {place.cuisine}
            </span>
            <span
              className={`text-sm font-bold ${PRICE_COLOR[place.price_range] ?? "text-foreground"}`}
            >
              {place.price_range}
            </span>
          </div>
        </div>
        <StarRating rating={place.rating} />
        {place.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{place.description}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          {place.governorate && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {place.governorate}
            </span>
          )}
          {place.address && <span className="truncate">{place.address}</span>}
        </div>
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Phone className="size-3" /> {place.phone}
          </a>
        )}
      </div>
    </article>
  );
}

function FoodPage() {
  const [cuisine, setCuisine] = useState("All");

  const { data: places = [], isLoading } = useQuery({
    queryKey: foodQueryKey(cuisine === "All" ? undefined : cuisine),
    queryFn: () => fetchFoodPlaces(cuisine === "All" ? undefined : cuisine),
  });

  const featured = places.filter((p) => p.is_featured);
  const rest = places.filter((p) => !p.is_featured);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Food & Restaurants</h1>
            <p className="text-sm text-muted-foreground">The best places to eat across Lebanon</p>
          </div>

          {/* Cuisine filter */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCuisine(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    cuisine === c
                      ? "bg-primary text-primary-foreground shadow-lift"
                      : "glass border border-border/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {c !== "All" && <span>{CUISINE_EMOJI[c]}</span>}
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Price guide: <span className="font-semibold text-green-600">$</span> = under $10 ·{" "}
              <span className="font-semibold text-amber-600">$$</span> = $10–25 ·{" "}
              <span className="font-semibold text-red-500">$$$</span> = $25+
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass animate-pulse rounded-3xl h-72" />
              ))}
            </div>
          )}

          {!isLoading && places.length === 0 && (
            <div className="glass rounded-3xl p-14 text-center space-y-3">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-orange-400/15 text-orange-600">
                <UtensilsCrossed className="size-8" />
              </div>
              <p className="font-semibold text-lg">No places found</p>
              <p className="text-sm text-muted-foreground">
                {cuisine === "All"
                  ? "Restaurant listings coming soon — check back shortly."
                  : `No ${cuisine} restaurants found yet.`}
              </p>
            </div>
          )}

          {!isLoading && featured.length > 0 && cuisine === "All" && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                ⭐ Featured
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured.map((p) => (
                  <FoodCard key={p.id} place={p} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && (cuisine !== "All" ? places : rest).length > 0 && (
            <div>
              {cuisine === "All" && (
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  All restaurants
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(cuisine !== "All" ? places : rest).map((p) => (
                  <FoodCard key={p.id} place={p} />
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
