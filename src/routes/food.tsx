import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UtensilsCrossed, MapPin, Phone } from "lucide-react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { fetchFoodPlaces, foodQueryKey, type DbFoodPlace } from "@/lib/db";

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food & Restaurants — FaceLeb" },
      { name: "description", content: "Discover the best restaurants and food places in Lebanon." },
    ],
  }),
  component: FoodPage,
});

const CUISINES = ["All", "Lebanese", "Armenian", "Mediterranean", "Street Food", "Seafood", "Japanese", "Café", "International"];
const CUISINE_EMOJI: Record<string, string> = {
  Lebanese: "🫙", Armenian: "🥘", Mediterranean: "🐟", "Street Food": "🌯",
  Seafood: "🦞", Japanese: "🍣", Café: "☕", International: "🌍",
};
const PRICE_COLOR: Record<string, string> = {
  "$": "text-green-600", "$$": "text-amber-600", "$$$": "text-red-500",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span className="flex items-center gap-1">
      <span className="text-gold text-sm">
        {"★".repeat(full)}{"☆".repeat(empty)}
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
        <img src={place.image_url} alt={place.name} className="h-44 w-full object-cover" loading="lazy" />
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
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold">⭐ Featured</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              {emoji} {place.cuisine}
            </span>
            <span className={`text-sm font-bold ${PRICE_COLOR[place.price_range] ?? "text-foreground"}`}>
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
          <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
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
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Food & Restaurants</h1>
            <p className="text-sm text-muted-foreground">The best places to eat across Lebanon</p>
          </div>

          {/* Cuisine filter */}
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
                Run the SQL migration to load restaurant data.
              </p>
            </div>
          )}

          {!isLoading && featured.length > 0 && cuisine === "All" && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                ⭐ Featured
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured.map((p) => <FoodCard key={p.id} place={p} />)}
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
                {(cuisine !== "All" ? places : rest).map((p) => <FoodCard key={p.id} place={p} />)}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
