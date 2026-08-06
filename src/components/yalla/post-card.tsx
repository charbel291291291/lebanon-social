import { useState } from "react";
import { BadgeCheck, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { reactions, type Post, type ReactionKey } from "@/lib/yalla-data";

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const [picked, setPicked] = useState<ReactionKey | null>(null);
  const [open, setOpen] = useState(false);
  const active = reactions.find((r) => r.key === picked);
  const total = post.counts.reactions + (picked ? 1 : 0);
  const pollTotal = post.poll?.options.reduce((a, o) => a + o.votes, 0) ?? 0;

  return (
    <article
      style={{ animationDelay: `${index * 70}ms` }}
      className="glass animate-rise overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-lift"
    >
      <header className="flex items-center gap-3 p-4">
        <Avatar className="size-11 ring-2 ring-primary/25">
          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
            {post.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold">
            {post.author}
            {post.verified && <BadgeCheck className="size-4 text-gold" aria-label="Verified" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {post.place} · {post.time}
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

      {post.image && (
        <img
          src={post.image}
          alt={post.body.slice(0, 60)}
          loading="lazy"
          width={1200}
          height={900}
          className="max-h-[26rem] w-full object-cover"
        />
      )}

      {post.poll && (
        <div className="space-y-2 px-4 pb-2">
          <p className="text-sm font-semibold">{post.poll.question}</p>
          {post.poll.options.map((o) => {
            const pct = Math.round((o.votes / pollTotal) * 100);
            return (
              <button
                key={o.label}
                className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-background/40 px-3 py-2 text-left text-sm font-medium"
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
        </div>
      )}

      <footer className="p-3">
        <div className="flex items-center justify-between px-1 pb-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="flex -space-x-1">
              {["👍", "❤️", "🌲"].map((e) => (
                <span key={e} className="grid size-5 place-items-center rounded-full bg-card text-[10px] ring-1 ring-border">
                  {e}
                </span>
              ))}
            </span>
            {total.toLocaleString()}
          </span>
          <span>
            {post.counts.comments} comments · {post.counts.shares} shares
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 border-t border-border/50 pt-2">
          <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {open && (
              <div className="glass absolute -top-14 left-0 z-20 flex animate-pop gap-1 rounded-full p-1.5">
                {reactions.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => {
                      setPicked(picked === r.key ? null : r.key);
                      setOpen(false);
                    }}
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
              onClick={() => setPicked(picked ? null : "like")}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold transition-colors hover:bg-primary/10 ${
                picked ? "text-primary" : "text-muted-foreground"
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