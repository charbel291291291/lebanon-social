import { CalendarDays, Flame, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fetchCommunities,
  fetchEvents,
  fetchTrends,
  commQueryKey,
  eventsQueryKey,
  trendsQueryKey,
  joinCommunity,
  leaveCommunity,
  rsvpEvent,
  type DbCommunity,
  type DbEvent,
  type DbTrend,
} from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function TrendsSection({ trends }: { trends: DbTrend[] }) {
  if (!trends.length) {
    return (
      <p className="text-xs text-muted-foreground">No trends yet · Check back soon</p>
    );
  }
  return (
    <ul className="space-y-2">
      {trends.map((t) => (
        <li key={t.id}>
          <button className="w-full rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-primary/8">
            <p className="text-sm font-semibold text-primary">{t.tag}</p>
            <p className="text-xs text-muted-foreground">{formatCount(t.post_count)} posts</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function EventItem({ event, userId }: { event: DbEvent; userId?: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => rsvpEvent(event.id, userId!, event.is_attending ? "not_going" : "going"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 text-xs font-bold text-accent">
        {formatEventDate(event.starts_at).split(" ")[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.place} · {formatCount(event.attendee_count)} going
        </p>
      </div>
      <Button
        size="sm"
        variant={event.is_attending ? "default" : "outline"}
        onClick={() => userId && mutation.mutate()}
        disabled={!userId || mutation.isPending}
        className="rounded-full text-xs"
      >
        {event.is_attending ? "Going ✓" : "RSVP"}
      </Button>
    </li>
  );
}

function CommunityItem({ community, userId }: { community: DbCommunity; userId?: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      community.is_member
        ? leaveCommunity(community.id, userId!)
        : joinCommunity(community.id, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{community.name}</p>
        <p className="text-xs text-muted-foreground">
          {community.type} · {formatCount(community.member_count)} members
        </p>
      </div>
      <Button
        size="sm"
        variant={community.is_member ? "outline" : "default"}
        onClick={() => userId && mutation.mutate()}
        disabled={!userId || mutation.isPending}
        className="rounded-full text-xs"
      >
        {community.is_member ? "Joined" : "Join"}
      </Button>
    </li>
  );
}

export function RightRail() {
  const { user } = useAuth();

  const { data: trends = [] } = useQuery({
    queryKey: trendsQueryKey(),
    queryFn: fetchTrends,
  });
  const { data: events = [] } = useQuery({
    queryKey: eventsQueryKey(user?.id),
    queryFn: () => fetchEvents(user?.id),
  });
  const { data: communities = [] } = useQuery({
    queryKey: commQueryKey(user?.id),
    queryFn: () => fetchCommunities(user?.id),
  });

  return (
    <aside className="sticky top-20 hidden h-fit w-80 shrink-0 flex-col gap-4 2xl:flex">
      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Flame className="size-4 text-gold" /> Trending in Lebanon
        </h2>
        <TrendsSection trends={trends} />
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <CalendarDays className="size-4 text-accent" /> Upcoming events
        </h2>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No upcoming events</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <EventItem key={e.id} event={e} userId={user?.id} />
            ))}
          </ul>
        )}
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Users className="size-4 text-primary" /> Communities near you
        </h2>
        {communities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No communities yet</p>
        ) : (
          <ul className="space-y-3">
            {communities.map((c) => (
              <CommunityItem key={c.id} community={c} userId={user?.id} />
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
