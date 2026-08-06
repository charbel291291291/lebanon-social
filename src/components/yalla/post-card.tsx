import { useState } from "react";
import { BadgeCheck, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { reactions, type ReactionKey } from "@/lib/yalla-data";
import {
  type DbPost,
  toggleReaction,
  votePoll,
  postsQueryKey,
  getInitials,
  relativeTime,
} from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

export function PostCard({ post, index = 0 }: { post: DbPost; index?: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reactionOpen, setReactionOpen] = useState(false);

  // ── Optimistic reaction toggle ─────────────────────────────────
  const reactionMutation = useMutation({
    mutationFn: ({ reaction }: { reaction: ReactionKey }) =>
      toggleReaction(post.id, user!.id, reaction, post.my_reaction),
    onMutate: async ({ reaction }) => {
      const qk = postsQueryKey(user?.id);
      await queryClient.cancelQueries({ queryKey: qk });
      const prev = queryClient.getQueryData<DbPost[]>(qk);

      queryClient.setQueryData<DbPost[]>(qk, (old) =>
        (old ?? []).map((p) => {
          if (p.id !== post.id) return p;
          const same = p.my_reaction === reaction;
          const counts = { ...p.reaction_counts };
          if (p.my_reaction) counts[p.my_reaction] = Math.max(0, (counts[p.my_reaction] ?? 0) - 1);
          if (!same) counts[reaction] = (counts[reaction] ?? 0) + 1;
          return {
            ...p,
            my_reaction: same ? null : reaction,
            reaction_counts: counts,
            total_reactions: p.total_reactions + (same ? -1 : p.my_reaction ? 0 : 1),
          };
        })
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(postsQueryKey(user?.id), ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  // ── Optimistic poll vote ────────────────────────────────────────
  const pollMutation = useMutation({
    mutationFn: ({ optionId }: { optionId: string }) =>
      votePoll(post.poll!.id, user!.id, optionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const handleReaction = (r: ReactionKey) => {
    if (!user) return;
    reactionMutation.mutate({ reaction: r });
    setReactionOpen(false);
  };

  const active = reactions.find((r) => r.key === post.my_reaction);
  const topReactions = Object.entries(post.reaction_counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => reactions.find((r) => r.key === k)?.emoji)
    .filter(Boolean) as string[];
  const displayEmojis = topReactions.length ? topReactions : ["👍", "❤️", "🌲"];

  const pollTotal = post.poll?.options.reduce((a, o) => a + o.vote_count, 0) ?? 0;
  const myVote = post.poll?.my_vote_option_id;

  return (
    <article
      style={{ animationDelay: `${index * 70}ms` }}
      className="glass animate-rise overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-lift"
    >
      <header className="flex items-center gap-3 p-4">
        <Avatar className="size-11 ring-2 ring-primary/25">
          {post.author.avatar_url && <AvatarImage src={post.author.avatar_url} />}
          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
            {getInitials(post.author.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold">
            {post.author.full_name || post.author.username}
            {post.author.is_verified && (
              <BadgeCheck className="size-4 text-gold" aria-label="Verified" />
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {post.place ?? post.governorate ?? "Lebanon"} · {relativeTime(post.created_at)}
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full border-0 bg-accent/12 text-accent">
          {post.tag}
        </Badge>
        <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Post options">
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      <p className="px-4 pb-3 text-[0.95rem] leading-relaxed">{post.body}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.body.slice(0, 60)}
          loading="lazy"
          className="max-h-[26rem] w-full object-cover"
        />
      )}

      {post.poll && (
        <div className="space-y-2 px-4 pb-2">
          <p className="text-sm font-semibold">{post.poll.question}</p>
          {post.poll.options.map((o) => {
            const pct = pollTotal > 0 ? Math.round((o.vote_count / pollTotal) * 100) : 0;
            const voted = myVote === o.id;
            return (
              <button
                key={o.id}
                onClick={() => user && pollMutation.mutate({ optionId: o.id })}
                disabled={!user || !!myVote || pollMutation.isPending}
                className={`relative w-full overflow-hidden rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  voted ? "border-primary/60 bg-primary/5" : "border-border/60 bg-background/40"
                }`}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex justify-between">
                  <span>{o.label}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </span>
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">{pollTotal} votes</p>
        </div>
      )}

      <footer className="p-3">
        <div className="flex items-center justify-between px-1 pb-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="flex -space-x-1">
              {displayEmojis.map((e) => (
                <span
                  key={e}
                  className="grid size-5 place-items-center rounded-full bg-card text-[10px] ring-1 ring-border"
                >
                  {e}
                </span>
              ))}
            </span>
            {post.total_reactions.toLocaleString()}
          </span>
          <span>
            {post.comment_count} comments
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 border-t border-border/50 pt-2">
          <div
            className="relative"
            onMouseEnter={() => setReactionOpen(true)}
            onMouseLeave={() => setReactionOpen(false)}
          >
            {reactionOpen && (
              <div className="glass absolute -top-14 left-0 z-20 flex animate-pop gap-1 rounded-full p-1.5">
                {reactions.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleReaction(r.key)}
                    title={r.label}
                    aria-label={r.label}
                    className="grid size-9 place-items-center rounded-full text-lg transition-transform hover:-translate-y-1 hover:scale-125"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => handleReaction("like")}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold transition-colors hover:bg-primary/10 ${
                post.my_reaction ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-base">{active?.emoji ?? "👍"}</span>
              {active?.label ?? "React"}
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent">
            <MessageSquare className="size-4" /> Comment
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-gold/15 hover:text-gold">
            <Share2 className="size-4" /> Share
          </button>
        </div>
      </footer>
    </article>
  );
}
