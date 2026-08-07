import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/yalla/top-bar";
import { LeftNav } from "@/components/yalla/left-nav";
import { RightRail } from "@/components/yalla/right-rail";
import { Button } from "@/components/ui/button";
import { fetchEvents, rsvpEvent, eventsQueryKey, type DbEvent } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — FaceLeb" },
      { name: "description", content: "Upcoming events happening across Lebanon." },
      { property: "og:title", content: "Events — FaceLeb" },
      { property: "og:description", content: "Upcoming events happening across Lebanon." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lebanon-social-main.vercel.app/events" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://lebanon-social-main.vercel.app/events" }],
  }),
  component: EventsPage,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-LB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventCard({ event, userId }: { event: DbEvent; userId?: string | undefined }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => rsvpEvent(event.id, userId!, event.is_attending ? "not_going" : "going"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="glass flex gap-4 rounded-3xl p-5">
      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent/20 text-center text-sm font-bold text-accent">
        <CalendarDays className="size-6" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{event.title}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" aria-hidden /> {formatDate(event.starts_at)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" aria-hidden /> {event.place}
        </p>
        <p className="text-xs text-muted-foreground">
          {event.attendee_count.toLocaleString()} going
        </p>
      </div>
      <Button
        size="sm"
        variant={event.is_attending ? "default" : "outline"}
        onClick={() => userId && mutation.mutate()}
        disabled={!userId || mutation.isPending}
        aria-pressed={event.is_attending}
        className="self-start rounded-full"
      >
        {event.is_attending ? "Going ✓" : "RSVP"}
      </Button>
    </div>
  );
}

function EventsPage() {
  const { user } = useAuth();
  const { data: events = [], isLoading } = useQuery({
    queryKey: eventsQueryKey(user?.id),
    queryFn: () => fetchEvents(user?.id),
  });

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <LeftNav />
        <div className="flex-1 space-y-5">
          <h1 className="text-2xl font-bold">Upcoming Events</h1>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass animate-pulse rounded-3xl p-5 h-28" />
              ))}
            </div>
          )}
          {!isLoading && events.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center">
              <p className="text-3xl">&#128197;</p>
              <p className="mt-3 font-semibold">No upcoming events</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon &mdash; events will appear here once the database is set up.
              </p>
            </div>
          )}
          {events.length > 0 && (
            <div className="space-y-4">
              {events.map((e) => (
                <EventCard key={e.id} event={e} userId={user?.id ?? undefined} />
              ))}
            </div>
          )}
        </div>
        <RightRail />
      </main>
    </div>
  );
}
