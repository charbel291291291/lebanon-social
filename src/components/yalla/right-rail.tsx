import { CalendarDays, Flame, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { communities, events, trends } from "@/lib/yalla-data";

export function RightRail() {
  return (
    <aside className="sticky top-20 hidden h-fit w-80 shrink-0 flex-col gap-4 2xl:flex">
      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Flame className="size-4 text-gold" /> Trending in Lebanon
        </h2>
        <ul className="space-y-2">
          {trends.map((t) => (
            <li key={t.tag}>
              <button className="w-full rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-primary/8">
                <p className="text-sm font-semibold text-primary">{t.tag}</p>
                <p className="text-xs text-muted-foreground">{t.posts}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <CalendarDays className="size-4 text-accent" /> Upcoming events
        </h2>
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.title} className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 text-xs font-bold text-accent">
                {e.when.split(" ")[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.place} · {e.going.toLocaleString()} going
                </p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full text-xs">
                RSVP
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Users className="size-4 text-primary" /> Communities near you
        </h2>
        <ul className="space-y-3">
          {communities.map((c) => (
            <li key={c.name} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.type} · {c.members} members
                </p>
              </div>
              <Button size="sm" className="rounded-full text-xs">
                Join
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}