import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, UtensilsCrossed, Store, Users } from "lucide-react";
import type React from "react";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { RightRail } from "@/components/yalla/right-rail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getInitials, relativeTime } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type SearchParams = { q?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — FaceLeb" },
      { name: "description", content: "Search posts, businesses, food, and people on FaceLeb." },
      { property: "og:title", content: "Search — FaceLeb" },
      {
        property: "og:description",
        content: "Search posts, businesses, food, and people on FaceLeb.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://faceleb.vercel.app/search" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://faceleb.vercel.app/search" }],
  }),
  component: SearchPage,
});

type PostResult = {
  id: string;
  body: string;
  tag: string;
  created_at: string;
  author: { id: string; username: string; full_name: string; avatar_url: string | null };
};
type BizResult = {
  id: string;
  name: string;
  category: string;
  governorate: string | null;
  logo_url: string | null;
};
type FoodResult = {
  id: string;
  name: string;
  cuisine: string;
  governorate: string | null;
  image_url: string | null;
};
type ListingResult = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  category: string;
  image_url: string | null;
};

async function searchAll(q: string) {
  const like = `%${q}%`;
  const [postsRes, businessesRes, foodRes, listingsRes] = await Promise.all([
    db
      .from("posts")
      .select(
        "id, body, tag, created_at, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url)",
      )
      .ilike("body", like)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("businesses")
      .select("id, name, category, governorate, logo_url")
      .ilike("name", like)
      .limit(5),
    db
      .from("food_places")
      .select("id, name, cuisine, governorate, image_url")
      .ilike("name", like)
      .limit(5),
    db
      .from("marketplace_listings")
      .select("id, title, price, currency, category, image_url")
      .ilike("title", like)
      .eq("status", "active")
      .limit(5),
  ]);

  return {
    posts: (postsRes.data ?? []) as PostResult[],
    businesses: (businessesRes.data ?? []) as BizResult[],
    food: (foodRes.data ?? []) as FoodResult[],
    listings: (listingsRes.data ?? []) as ListingResult[],
  };
}

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="glass rounded-3xl p-4 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4 text-primary" />
        {title}
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {count}
        </span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchAll(q!),
    enabled: !!q && q.length >= 2,
    staleTime: 30_000,
  });

  const total = data
    ? data.posts.length + data.businesses.length + data.food.length + data.listings.length
    : 0;

  return (
    <div className="min-h-screen">
      <TopBar initialQuery={q} />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-4">
          {!q && (
            <div className="glass rounded-3xl p-14 text-center space-y-2">
              <Search className="mx-auto size-10 text-muted-foreground" />
              <p className="font-semibold">Search FaceLeb</p>
              <p className="text-sm text-muted-foreground">
                Find posts, businesses, food spots, and marketplace listings.
              </p>
            </div>
          )}

          {q && q.length < 2 && (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass h-24 animate-pulse rounded-3xl" />
              ))}
            </div>
          )}

          {data && total === 0 && q && (
            <div className="glass rounded-3xl p-14 text-center space-y-2">
              <Search className="mx-auto size-10 text-muted-foreground" />
              <p className="font-semibold">No results for &ldquo;{q}&rdquo;</p>
              <p className="text-sm text-muted-foreground">Try different keywords.</p>
            </div>
          )}

          {data && (
            <>
              <ResultSection title="Posts" icon={Users} count={data.posts.length}>
                {data.posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 rounded-2xl bg-background/50 p-3"
                  >
                    <Avatar className="size-9 shrink-0">
                      {p.author.avatar_url && <AvatarImage src={p.author.avatar_url} />}
                      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                        {getInitials(p.author.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">
                        {p.author.full_name || p.author.username}
                      </p>
                      <p className="line-clamp-2 text-sm text-foreground/80" dir="auto">
                        {p.body}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {relativeTime(p.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </ResultSection>

              <ResultSection title="Businesses" icon={Building2} count={data.businesses.length}>
                {data.businesses.map((b) => (
                  <Link
                    key={b.id}
                    to="/businesses"
                    className="flex items-center gap-3 rounded-2xl bg-background/50 p-3 hover:bg-primary/5 transition-colors"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg overflow-hidden">
                      {b.logo_url ? (
                        <img src={b.logo_url} alt="" className="size-9 object-cover" />
                      ) : (
                        "🏢"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.category}
                        {b.governorate ? ` · ${b.governorate}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </ResultSection>

              <ResultSection
                title="Food & Restaurants"
                icon={UtensilsCrossed}
                count={data.food.length}
              >
                {data.food.map((f) => (
                  <Link
                    key={f.id}
                    to="/food"
                    className="flex items-center gap-3 rounded-2xl bg-background/50 p-3 hover:bg-primary/5 transition-colors"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-lg overflow-hidden">
                      {f.image_url ? (
                        <img src={f.image_url} alt="" className="size-9 object-cover" />
                      ) : (
                        "🍽️"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.cuisine}
                        {f.governorate ? ` · ${f.governorate}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </ResultSection>

              <ResultSection title="Marketplace" icon={Store} count={data.listings.length}>
                {data.listings.map((l) => (
                  <Link
                    key={l.id}
                    to="/marketplace"
                    className="flex items-center gap-3 rounded-2xl bg-background/50 p-3 hover:bg-primary/5 transition-colors"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-lg overflow-hidden">
                      {l.image_url ? (
                        <img src={l.image_url} alt="" className="size-9 object-cover" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.price
                          ? l.currency === "LBP"
                            ? `${l.price.toLocaleString()} L.L.`
                            : `$${l.price.toLocaleString()}`
                          : "Free"}{" "}
                        · {l.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </ResultSection>
            </>
          )}
        </div>
        <RightRail />
      </main>
    </div>
  );
}
