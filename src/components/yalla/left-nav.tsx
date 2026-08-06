import {
  Home,
  Users,
  CalendarDays,
  Store,
  Building2,
  UtensilsCrossed,
  Mountain,
  Flame,
  MapPinned,
} from "lucide-react";
import { governorates } from "@/lib/yalla-data";

const items = [
  { icon: Home, label: "Feed", active: true },
  { icon: Users, label: "Communities" },
  { icon: CalendarDays, label: "Events" },
  { icon: Store, label: "Marketplace" },
  { icon: Building2, label: "Businesses" },
  { icon: UtensilsCrossed, label: "Food" },
  { icon: Mountain, label: "Tourism" },
  { icon: Flame, label: "Trending" },
];

export function LeftNav() {
  return (
    <nav className="sticky top-20 hidden h-fit w-64 shrink-0 flex-col gap-4 lg:flex" aria-label="Primary">
      <div className="glass rounded-3xl p-2">
        {items.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-primary/10 ${
              active ? "bg-primary/12 text-primary" : "text-foreground/80"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MapPinned className="size-4" /> Explore by governorate
        </p>
        <div className="flex flex-wrap gap-2">
          {governorates.map((g) => (
            <button
              key={g}
              className="rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}