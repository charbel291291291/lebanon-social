import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Globe, Lock, MapPin, MessageCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveMedia, type Profile } from "@/lib/profile";

function initials(profile: Profile) {
  const source = profile.full_name || profile.username;
  return source.slice(0, 2).toUpperCase();
}

export function ProfileView({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    resolveMedia(profile.avatar_url).then((url) => alive && setAvatar(url));
    resolveMedia(profile.cover_url).then((url) => alive && setCover(url));
    return () => {
      alive = false;
    };
  }, [profile.avatar_url, profile.cover_url]);

  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="relative h-44 w-full bg-gradient-to-br from-primary/30 via-accent/20 to-gold/25 sm:h-60">
        {cover && (
          <img
            src={cover}
            alt={`${profile.full_name || profile.username} cover photo`}
            className="size-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="relative px-5 pb-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
          <Avatar className="size-24 rounded-3xl ring-4 ring-background">
            {avatar && (
              <AvatarImage
                src={avatar}
                alt={`${profile.username} avatar`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-3xl bg-primary/15 text-xl font-bold text-primary">
              {initials(profile)}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2 pb-1">
            {isOwner ? (
              <Button asChild className="rounded-full">
                <Link to="/settings">
                  <Settings2 className="size-4" /> Edit profile
                </Link>
              </Button>
            ) : (
              profile.allow_messages && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => toast.info("Messages coming soon!")}
                >
                  <MessageCircle className="size-4" /> Message
                </Button>
              )
            )}
          </div>
        </div>

        <div className="mt-4">
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
            {profile.full_name || profile.username}
            {profile.is_verified && (
              <BadgeCheck className="size-6 text-gold" aria-label="Verified account" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.is_private && (
              <Badge variant="secondary" className="rounded-full">
                <Lock className="mr-1 size-3" /> Private profile
              </Badge>
            )}
            {profile.show_governorate && profile.governorate && (
              <Badge variant="secondary" className="rounded-full">
                <MapPin className="mr-1 size-3" /> {profile.governorate}
              </Badge>
            )}
            {profile.website && /^https?:\/\//i.test(profile.website) && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                <Globe className="size-3" /> {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
