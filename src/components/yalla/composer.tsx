import { useState, useRef } from "react";
import { Image, MapPin, Smile, BarChart3, Video, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { postTags } from "@/lib/yalla-data";
import { createPost, postsQueryKey, getInitials } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const MAX_POST_LENGTH = 500;

const actions = [
  { icon: Image, label: "Photo", msg: "Photo posts coming soon!" },
  { icon: Video, label: "Video", msg: "Video posts coming soon!" },
  { icon: BarChart3, label: "Poll", msg: "Poll creation coming soon!" },
  { icon: MapPin, label: "Location", msg: "Location tagging coming soon!" },
  { icon: Smile, label: "Feeling", msg: "Feelings coming soon!" },
];

export function Composer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [tag, setTag] = useState<string>("General");
  const [expanded, setExpanded] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createPost(user!.id, body.trim(), tag),
    onSuccess: () => {
      setBody("");
      setExpanded(false);
      setShowTagPicker(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post shared!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remaining = MAX_POST_LENGTH - body.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || remaining < 0) return;
    mutation.mutate();
  };

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
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email ||
    "";

  const avatarUrl =
    profile?.avatar_url || (user?.user_metadata?.["avatar_url"] as string | undefined) || null;

  return (
    <section className="glass rounded-3xl p-4">
      <form onSubmit={submit}>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-primary/30">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
              {user ? getInitials(displayName) : "?"}
            </AvatarFallback>
          </Avatar>

          {user ? (
            <input
              ref={inputRef}
              aria-label="Create a post"
              placeholder="Shu fi ma fi? Share something with your community…"
              dir="auto"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setExpanded(true)}
              className="h-11 flex-1 rounded-full border border-border/60 bg-background/50 px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          ) : (
            <Link
              to="/auth"
              search={{ next: undefined }}
              className="h-11 flex-1 cursor-pointer rounded-full border border-border/60 bg-background/50 px-4 text-sm leading-[2.75rem] text-muted-foreground transition-colors hover:bg-muted/40"
            >
              Shu fi ma fi? Sign in to share…
            </Link>
          )}

          {expanded && user && (
            <div className="flex items-center gap-2">
              {remaining <= 100 && (
                <span
                  className={`text-xs font-semibold tabular-nums ${remaining < 0 ? "text-cedar" : "text-muted-foreground"}`}
                  aria-live="polite"
                  aria-label={`${remaining} characters remaining`}
                >
                  {remaining}
                </span>
              )}
              <Button
                type="submit"
                disabled={!body.trim() || mutation.isPending || remaining < 0}
                className="rounded-full px-5 font-semibold"
              >
                {mutation.isPending ? "Posting…" : "Post"}
              </Button>
            </div>
          )}

          {!expanded && (
            <Button
              type="button"
              onClick={() => {
                setExpanded(true);
                inputRef.current?.focus();
              }}
              className="hidden rounded-full px-5 font-semibold sm:inline-flex"
            >
              Post
            </Button>
          )}
        </div>

        {expanded && user && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
            {/* Tag picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagPicker((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40"
              >
                {tag} <ChevronDown className="size-3" />
              </button>
              {showTagPicker && (
                <div className="glass absolute left-0 top-full z-30 mt-1 flex flex-wrap gap-1.5 rounded-2xl p-2 shadow-lift">
                  {postTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTag(t);
                        setShowTagPicker(false);
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        tag === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1">
              {actions.map(({ icon: Icon, label, msg }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toast.info(msg)}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!expanded && (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-3">
            {actions.map(({ icon: Icon, label, msg }) => (
              <button
                key={label}
                type="button"
                onClick={() => toast.info(msg)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}
