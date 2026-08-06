import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchStories, storiesQueryKey, getInitials, type DbStory } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function StoryCard({ story, i }: { story: DbStory; i: number }) {
  return (
    <button
      style={{ animationDelay: `${i * 45}ms` }}
      className="group relative h-40 w-26 min-w-[6.5rem] shrink-0 animate-rise overflow-hidden rounded-2xl ring-1 ring-border/60 transition-transform duration-300 hover:-translate-y-1"
    >
      <img
        src={story.image_url}
        alt=""
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute left-2 top-2 size-8 rounded-full bg-gradient-to-br from-gold to-primary p-[2px]">
        <span className="grid size-full place-items-center rounded-full bg-card text-[10px] font-bold text-foreground">
          {getInitials(story.author.full_name)}
        </span>
      </span>
      <span className="absolute inset-x-2 bottom-2 truncate text-left text-xs font-semibold text-white">
        {story.author.full_name || story.author.username}
      </span>
    </button>
  );
}

export function Stories() {
  const { user } = useAuth();
  const { data: stories = [] } = useQuery({
    queryKey: storiesQueryKey(user?.id),
    queryFn: fetchStories,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data as { full_name: string; avatar_url: string | null } | null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "";

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null;

  return (
    <section aria-label="Stories" className="glass rounded-3xl p-3">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {/* "Add your story" card — always first */}
        <button className="group relative h-40 w-26 min-w-[6.5rem] shrink-0 animate-rise overflow-hidden rounded-2xl ring-1 ring-border/60 transition-transform duration-300 hover:-translate-y-1">
          <div className="size-full bg-gradient-to-br from-primary/20 to-accent/20" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-3 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift">
            <Plus className="size-4" />
          </span>
          {user && (
            <Avatar className="absolute left-1/2 top-3 size-8 -translate-x-1/2">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="absolute inset-x-2 bottom-2 truncate text-left text-xs font-semibold text-white">
            Your story
          </span>
        </button>

        {stories.map((s, i) => (
          <StoryCard key={s.id} story={s} i={i + 1} />
        ))}
      </div>
    </section>
  );
}
