import { useState, memo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Building2, Phone, Globe, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { RightRail } from "@/components/yalla/right-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBusinesses, createBusiness, businessesQueryKey, type DbBusiness } from "@/lib/db";
import { governorates } from "@/lib/yalla-data";
import { useAuth } from "@/hooks/use-auth";
import { normalizeUrl, isValidHttpUrl } from "@/lib/url";

export const Route = createFileRoute("/businesses")({
  head: () => ({
    meta: [
      { title: "Businesses — FaceLeb" },
      { name: "description", content: "Discover and support Lebanese businesses near you." },
      { property: "og:title", content: "Businesses — FaceLeb" },
      { property: "og:description", content: "Discover and support Lebanese businesses near you." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://faceleb.vercel.app/businesses" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://faceleb.vercel.app/businesses" }],
  }),
  component: BusinessesPage,
});

const CATEGORIES = [
  "All",
  "Restaurant",
  "Café",
  "Shop & Retail",
  "Healthcare",
  "Education",
  "Beauty & Salon",
  "Gym & Fitness",
  "Hotel",
  "Services",
  "Tech",
  "Other",
];
const CAT_EMOJI: Record<string, string> = {
  Restaurant: "🍽️",
  Café: "☕",
  "Shop & Retail": "🛍️",
  Healthcare: "🏥",
  Education: "🎓",
  "Beauty & Salon": "💇",
  "Gym & Fitness": "🏋️",
  Hotel: "🏨",
  Services: "🔧",
  Tech: "💻",
  Other: "🏢",
};
const CAT_COLORS: Record<string, string> = {
  Restaurant: "from-orange-400/20 to-red-400/20",
  Café: "from-amber-400/20 to-yellow-300/20",
  "Shop & Retail": "from-pink-400/20 to-rose-400/20",
  Healthcare: "from-blue-400/20 to-cyan-400/20",
  Education: "from-violet-400/20 to-purple-400/20",
  "Beauty & Salon": "from-pink-300/20 to-fuchsia-300/20",
  "Gym & Fitness": "from-green-400/20 to-emerald-400/20",
  Hotel: "from-gold/20 to-amber-400/20",
  Services: "from-slate-400/20 to-gray-400/20",
  Tech: "from-primary/20 to-blue-400/20",
  Other: "from-muted/40 to-muted/20",
};

const BusinessCard = memo(function BusinessCard({ business }: { business: DbBusiness }) {
  const emoji = CAT_EMOJI[business.category] ?? "🏢";
  const gradient = CAT_COLORS[business.category] ?? "from-muted/40 to-muted/20";
  return (
    <article className="glass flex flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-lift">
      <div
        className={`flex h-28 items-center justify-center bg-gradient-to-br ${gradient} text-4xl`}
      >
        {business.logo_url ? (
          <img src={business.logo_url} alt="" className="size-20 rounded-2xl object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold">{business.name}</p>
          {business.is_verified && <BadgeCheck className="size-4 shrink-0 text-gold" />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {business.category}
          </span>
          {business.governorate && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {business.governorate}
            </span>
          )}
        </div>
        {business.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{business.description}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Phone className="size-3" /> {business.phone}
            </a>
          )}
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Globe className="size-3" /> Website
            </a>
          )}
        </div>
      </div>
    </article>
  );
});

function AddBusinessForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    category: "Other",
    description: "",
    governorate: "",
    phone: "",
    website: "",
  });

  const mutation = useMutation({
    mutationFn: () => {
      const rawWebsite = form.website.trim();
      const website = rawWebsite ? normalizeUrl(rawWebsite) : undefined;
      if (website && !isValidHttpUrl(website)) throw new Error("Please enter a valid website URL.");
      const data: Parameters<typeof createBusiness>[1] = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        ...(form.governorate ? { governorate: form.governorate } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(website ? { website } : {}),
      };
      return createBusiness(user!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Business added!");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="glass rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Add a business</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Business name *</Label>
          <Input
            className="rounded-xl"
            placeholder="e.g. Café Younes"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Governorate</Label>
          <Select value={form.governorate} onValueChange={(v) => set("governorate", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {governorates.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Description</Label>
          <textarea
            className="w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
            placeholder="What does this business offer?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            className="rounded-xl"
            placeholder="+961 1 234 567"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Website</Label>
          <Input
            className="rounded-xl"
            placeholder="https://..."
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={() => mutation.mutate()}
        disabled={!form.name.trim() || mutation.isPending}
        className="rounded-full px-6"
      >
        {mutation.isPending ? "Adding…" : "Add business"}
      </Button>
    </div>
  );
}

function BusinessesPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: businessesQueryKey(category === "All" ? undefined : category),
    queryFn: () => fetchBusinesses(category === "All" ? undefined : category),
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Local Businesses</h1>
              <p className="text-sm text-muted-foreground">
                Discover and support Lebanese businesses near you
              </p>
            </div>
            {user && (
              <Button onClick={() => setShowForm((v) => !v)} className="rounded-full gap-2">
                <Plus className="size-4" /> Add business
              </Button>
            )}
          </div>

          {showForm && user && <AddBusinessForm onClose={() => setShowForm(false)} />}

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
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
                <div key={i} className="glass animate-pulse rounded-3xl h-56" />
              ))}
            </div>
          )}

          {!isLoading && businesses.length === 0 && (
            <div className="glass rounded-3xl p-14 text-center space-y-3">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Building2 className="size-8" />
              </div>
              <p className="font-semibold text-lg">No businesses listed yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {user ? "Add your business and get discovered!" : "Sign in to list your business."}
              </p>
              {user && (
                <Button onClick={() => setShowForm(true)} className="rounded-full gap-2 mt-2">
                  <Plus className="size-4" /> Add a business
                </Button>
              )}
            </div>
          )}

          {businesses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {businesses.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          )}
        </div>
        <RightRail />
      </main>
    </div>
  );
}
