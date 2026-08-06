import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Tag, Package } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchListings, createListing, listingsQueryKey, getInitials, relativeTime,
  type DbListing,
} from "@/lib/db";
import { governorates } from "@/lib/yalla-data";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — FaceLeb" },
      { name: "description", content: "Buy and sell within the Lebanese community." },
    ],
  }),
  component: MarketplacePage,
});

const CATEGORIES = ["All", "Electronics", "Furniture", "Cars & Vehicles", "Clothing & Fashion", "Real Estate", "Books & Education", "Sports & Leisure", "Services", "Other"];
const CONDITIONS = ["new", "like_new", "good", "fair", "used"];
const COND_LABEL: Record<string, string> = { new: "New", like_new: "Like New", good: "Good", fair: "Fair", used: "Used" };
const COND_COLOR: Record<string, string> = { new: "text-green-600", like_new: "text-emerald-600", good: "text-blue-600", fair: "text-amber-600", used: "text-gray-500" };
const CAT_EMOJI: Record<string, string> = {
  Electronics: "🖥️", Furniture: "🛋️", "Cars & Vehicles": "🚗", "Clothing & Fashion": "👕",
  "Real Estate": "🏠", "Books & Education": "📚", "Sports & Leisure": "⚽", Services: "🔧", Other: "📦",
};

function formatPrice(price: number | null, currency: string) {
  if (!price) return "Free / Make offer";
  if (currency === "LBP") return `${price.toLocaleString()} L.L.`;
  return `$${price.toLocaleString()}`;
}

function ListingCard({ listing }: { listing: DbListing }) {
  const emoji = CAT_EMOJI[listing.category] ?? "📦";
  return (
    <article className="glass flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lift">
      {listing.image_url ? (
        <img src={listing.image_url} alt={listing.title} className="h-44 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 text-5xl">
          {emoji}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-tight">{listing.title}</p>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {listing.category}
          </span>
        </div>
        <p className="text-lg font-bold text-primary">{formatPrice(listing.price, listing.currency)}</p>
        {listing.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{listing.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          <span className={`font-semibold ${COND_COLOR[listing.condition] ?? ""}`}>
            {COND_LABEL[listing.condition] ?? listing.condition}
          </span>
          {listing.governorate && ` · ${listing.governorate}`}
          {` · ${relativeTime(listing.created_at)}`}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Avatar className="size-6">
            {listing.seller?.avatar_url && <AvatarImage src={listing.seller.avatar_url} />}
            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
              {getInitials(listing.seller?.full_name ?? "")}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground">
            {listing.seller?.full_name || listing.seller?.username || "Seller"}
          </p>
        </div>
      </div>
    </article>
  );
}

function CreateListingForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "", description: "", price: "", currency: "USD",
    category: "Other", condition: "good", governorate: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      createListing(user!.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        category: form.category,
        condition: form.condition,
        governorate: form.governorate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing posted!");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="glass rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Post a listing</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Title *</Label>
          <Input className="rounded-xl" placeholder="e.g. iPhone 14 Pro — excellent condition" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Description</Label>
          <textarea
            className="w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3} placeholder="Describe your item..." value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>Price</Label>
            <Input className="rounded-xl" type="number" min="0" placeholder="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div className="w-28 space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="LBP">LBP (L.L.)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Governorate</Label>
          <Select value={form.governorate} onValueChange={(v) => set("governorate", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {governorates.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Condition *</Label>
          <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{COND_LABEL[c]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        onClick={() => mutation.mutate()}
        disabled={!form.title.trim() || mutation.isPending}
        className="rounded-full px-6"
      >
        {mutation.isPending ? "Posting…" : "Post listing"}
      </Button>
    </div>
  );
}

function MarketplacePage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: listingsQueryKey(category === "All" ? undefined : category),
    queryFn: () => fetchListings(category === "All" ? undefined : category),
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Marketplace</h1>
              <p className="text-sm text-muted-foreground">Buy and sell within the Lebanese community</p>
            </div>
            {user && (
              <Button onClick={() => setShowForm((v) => !v)} className="rounded-full gap-2">
                <Plus className="size-4" /> Post listing
              </Button>
            )}
          </div>

          {showForm && user && <CreateListingForm onClose={() => setShowForm(false)} />}

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

          {!isLoading && listings.length === 0 && (
            <div className="glass rounded-3xl p-14 text-center space-y-3">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Package className="size-8" />
              </div>
              <p className="font-semibold text-lg">No listings yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {user ? "Be the first to post something!" : "Sign in to post your first listing."}
              </p>
              {user && (
                <Button onClick={() => setShowForm(true)} className="rounded-full gap-2 mt-2">
                  <Plus className="size-4" /> Post a listing
                </Button>
              )}
            </div>
          )}

          {listings.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
