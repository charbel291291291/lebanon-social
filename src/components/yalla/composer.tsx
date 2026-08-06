import { Image, MapPin, Smile, BarChart3, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Image, label: "Photo" },
  { icon: Video, label: "Video" },
  { icon: BarChart3, label: "Poll" },
  { icon: MapPin, label: "Location" },
  { icon: Smile, label: "Feeling" },
];

export function Composer() {
  return (
    <section className="glass rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">YO</AvatarFallback>
        </Avatar>
        <input
          aria-label="Create a post"
          placeholder="Shu fi ma fi? Share something with your community…"
          className="h-11 flex-1 rounded-full border border-border/60 bg-background/50 px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
        <Button className="hidden rounded-full px-5 font-semibold sm:inline-flex">Post</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-3">
        {actions.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}