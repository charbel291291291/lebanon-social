import { memo, useState, useCallback, useRef, useEffect } from "react";
import { BadgeCheck, MessageSquare, Share2, MoreHorizontal, Send, Link2, Flag } from "lucide-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { reactions, type ReactionKey } from "@/lib/yalla-data";
import {
  type DbPost,
  type DbComment,
  toggleReaction,
  votePoll,
  postsQueryKey,
  fetchComments,
  addComment,
  getInitials,
  relativeTime,
} from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

// ── Options dropdown ────────────────────────────────────────────

function PostOptions({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?post=${postId}`);
    toast.success("Link copied to clipboard");
    setOpen(false);
  };

  const report = () => {
    toast.success("Post reported. We'll review it shortly.");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        aria-label="Post options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="glass absolute right-0 top-8 z-30 min-w-[160px] overflow-hidden rounded-2xl shadow-lift"
        >
          <button
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10"
          >
            <Link2 className="size-4 text-muted-foreground" />
            Copy link
          </button>
          <button
            role="menuitem"
            onClick={report}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-cedar hover:bg-cedar/10"
          >
            <Flag className="size-4" />
            Report post
          </button>
        </div>
      )}
    </div>
  );
}

// ── Comment section ─────────────────────────────────────────────

function CommentSection({ post }: { post: DbPost }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => fetchComments(post.id),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () => addComment(post.id, user!.id, body.trim()),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["comments", post.id] });
      const prev = queryClient.getQueryData<DbComment[]>(["comments", post.id]);
      // Optimistically add with minimal author data
      const optimistic: DbComment = {
        id: `temp-${Date.now()}`,
        body: body.trim(),
        created_at: new Date().toISOString(),
        author: {
          id: user!.id,
          username: "",
          full_name: (user?.user_metadata?.["full_name"] as string) || user?.email || "",
          avatar_url: (user?.user_metadata?.["avatar_url"] as string | null) || null,
          is_verified: false,
        },
      };
      queryClient.setQueryData<DbComment[]>(["comments", post.id], (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["comments", post.id], ctx.prev);
      toast.error("Failed to post comment");
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="space-y-3 border-t border-border/50 px-4 py-3">
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="size-7 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 animate-pulse rounded-2xl bg-muted h-8" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-xs text-muted-foreground">Be the first to comment.</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar className="mt-0.5 size-7 shrink-0">
            {c.author.avatar_url && <AvatarImage src={c.author.avatar_url} />}
            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
              {getInitials(c.author.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="rounded-2xl bg-background/60 px-3 py-2">
              <p className="text-xs font-semibold leading-tight">
                {c.author.full_name || c.author.username}
              </p>
              <p className="text-sm leading-snug" dir="auto">
                {c.body}
              </p>
            </div>
            <p className="mt-0.5 px-1 text-[10px] text-muted-foreground">
              {relativeTime(c.created_at)}
            </p>
          </div>
        </div>
      ))}

      {user && (
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            dir="auto"
            maxLength={500}
            aria-label="Write a comment"
            className="h-9 flex-1 rounded-full border border-border/60 bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={!body.trim() || mutation.isPending}
            aria-label="Post comment"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}

      {!user && (
        <p className="text-xs text-muted-foreground">
          <a href="/auth" className="font-semibold text-primary hover:underline">
            Sign in
          </a>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}

// ── Post card ───────────────────────────────────────────────────

export const PostCard = memo(function PostCard({
  post,
  index = 0,
}: {
  post: DbPost;
  index?: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reactionOpen, setReactionOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  // Close reaction picker when user clicks/taps outside
  useEffect(() => {
    if (!reactionOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setReactionOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [reactionOpen]);

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
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(postsQueryKey(user?.id), ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const pollMutation = useMutation({
    mutationFn: ({ optionId }: { optionId: string }) => votePoll(post.poll!.id, user!.id, optionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const { mutate: fireReaction } = reactionMutation;
  const handleReaction = useCallback(
    (r: ReactionKey) => {
      if (!user) return;
      fireReaction({ reaction: r });
      setReactionOpen(false);
    },
    [user, fireReaction],
  );

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${post.author.full_name || post.author.username} on FaceLeb`,
      text: post.body.slice(0, 140),
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }, [post]);

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
        <PostOptions postId={post.id} />
      </header>

      <p className="px-4 pb-3 text-[0.95rem] leading-relaxed" dir="auto">
        {post.body}
      </p>

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
                aria-pressed={voted}
                className={`relative w-full overflow-hidden rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  voted ? "border-primary/60 bg-primary/5" : "border-border/60 bg-background/40"
                }`}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                  aria-hidden
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
            <span className="flex -space-x-1" aria-hidden>
              {[...new Set(displayEmojis)].map((e) => (
                <span
                  key={e}
                  className="grid size-5 place-items-center rounded-full bg-card text-[10px] ring-1 ring-border"
                >
                  {e}
                </span>
              ))}
            </span>
            {post.total_reactions > 0 && <span>{post.total_reactions.toLocaleString()}</span>}
          </span>
          <button
            onClick={() => setShowComments((v) => !v)}
            aria-label={`${showComments ? "Hide" : "Show"} comments${post.comment_count > 0 ? ` — ${post.comment_count}` : ""}`}
            className="hover:underline"
          >
            {post.comment_count > 0
              ? `${post.comment_count} comment${post.comment_count !== 1 ? "s" : ""}`
              : null}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 border-t border-border/50 pt-2">
          <div
            ref={reactionRef}
            className="relative"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setReactionOpen(true);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setReactionOpen(false);
            }}
          >
            {reactionOpen && (
              <div
                role="toolbar"
                aria-label="Reactions"
                className="glass absolute -top-14 left-0 z-20 flex animate-pop gap-1 rounded-full p-1.5"
              >
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
              onClick={() => {
                if (!user) return;
                if (reactionOpen) {
                  handleReaction("like");
                } else if (post.my_reaction) {
                  handleReaction(post.my_reaction);
                } else {
                  setReactionOpen(true);
                }
              }}
              aria-label={active ? `Remove ${active.label} reaction` : "React — tap to choose"}
              aria-expanded={reactionOpen}
              aria-haspopup="menu"
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold transition-colors hover:bg-primary/10 ${
                post.my_reaction ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-base" aria-hidden>
                {active?.emoji ?? "👍"}
              </span>
              {active?.label ?? "React"}
            </button>
          </div>

          <button
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            aria-label={`${showComments ? "Hide" : "Show"} comments`}
            className="flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
          >
            <MessageSquare className="size-4" aria-hidden />
            Comment
          </button>

          <button
            onClick={handleShare}
            aria-label="Share post"
            className="flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-gold/15 hover:text-gold"
          >
            <Share2 className="size-4" aria-hidden />
            Share
          </button>
        </div>
      </footer>

      {showComments && <CommentSection post={post} />}
    </article>
  );
});
