import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ImagePlus, LogOut, Loader2, User, Lock, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/yalla/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { governorates } from "@/lib/yalla-data";
import {
  ensureProfile,
  slugifyUsername,
  uploadProfileMedia,
  resolveMedia,
  type Profile,
} from "@/lib/profile";
import { normalizeUrl, isValidHttpUrl } from "@/lib/url";
import { getInitials } from "@/lib/db";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FaceLeb" },
      { name: "description", content: "Manage your FaceLeb account settings." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => ensureProfile(user.id, user.email ?? undefined),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  useEffect(() => {
    let alive = true;
    resolveMedia(form?.avatar_url).then((url) => alive && setResolvedAvatar(url));
    return () => {
      alive = false;
    };
  }, [form?.avatar_url]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const pick = async (kind: "avatar" | "cover", file?: File) => {
    if (!file || !form) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, GIF, WebP, or AVIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    setUploading(kind);
    try {
      const path = await uploadProfileMedia(user.id, kind, file);
      set(kind === "avatar" ? "avatar_url" : "cover_url", path);
      toast.success(`${kind === "avatar" ? "Avatar" : "Cover photo"} uploaded — remember to save.`);
    } catch {
      toast.error("Upload failed. Try a smaller image.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form) return;
    const username = slugifyUsername(form.username);
    if (username.length < 3) {
      toast.error("Username needs at least 3 letters or numbers.");
      return;
    }
    const rawWebsite = form.website?.trim() ?? "";
    const website = rawWebsite ? normalizeUrl(rawWebsite) : null;
    if (website && !isValidHttpUrl(website)) {
      toast.error("Please enter a valid website URL.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: form.full_name.trim(),
        bio: form.bio?.trim() ?? null,
        avatar_url: form.avatar_url,
        cover_url: form.cover_url,
        governorate: form.governorate,
        website,
        is_private: form.is_private,
        show_governorate: form.show_governorate,
        allow_messages: form.allow_messages,
        searchable: form.searchable,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That username is taken." : error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["my-profile-nav", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profile", username] });
    toast.success("Profile saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  };

  if (!form) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-8">
          <div className="space-y-4">
            <div className="glass h-32 animate-pulse rounded-3xl" />
            <div className="glass h-64 animate-pulse rounded-3xl" />
            <div className="glass h-48 animate-pulse rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  const displayName = form.full_name || form.username;

  const privacy = [
    {
      key: "is_private" as const,
      label: "Private profile",
      hint: "Only followers can view your profile.",
    },
    {
      key: "show_governorate" as const,
      label: "Show my governorate",
      hint: "Display your Lebanese region on your profile.",
    },
    {
      key: "allow_messages" as const,
      label: "Allow messages",
      hint: "Let other members start a chat with you.",
    },
    {
      key: "searchable" as const,
      label: "Appear in search",
      hint: "Let people find you by name or username.",
    },
  ];

  return (
    <div className="min-h-screen">
      <TopBar />
      <main id="main-content" className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
          Settings
        </h1>

        {/* Profile section */}
        <section className="glass space-y-5 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="font-semibold">Profile</h2>
            {form.is_verified && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            )}
          </div>

          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-16 ring-2 ring-primary/30">
                {resolvedAvatar && <AvatarImage src={resolvedAvatar} className="object-cover" />}
                <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-file"
                className="absolute -bottom-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90"
                title="Change avatar"
              >
                {uploading === "avatar" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Camera className="size-3" />
                )}
              </label>
              <input
                id="avatar-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pick("avatar", e.target.files?.[0])}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">@{form.username}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Cover upload */}
          <div className="space-y-1.5">
            <Label htmlFor="cover-file">Cover photo</Label>
            <label
              htmlFor="cover-file"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {uploading === "cover" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              Upload cover photo
            </label>
            <input
              id="cover-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pick("cover", e.target.files?.[0])}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => set("username", slugifyUsername(e.target.value))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Display name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              maxLength={280}
              value={form.bio ?? ""}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Manoushe lover from Batroun 🌲"
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="governorate">Governorate</Label>
              <Select value={form.governorate ?? ""} onValueChange={(v) => set("governorate", v)}>
                <SelectTrigger id="governorate" className="rounded-xl">
                  <SelectValue placeholder="Choose your region" />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://"
                className="rounded-xl"
              />
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </section>

        {/* Privacy section */}
        <section className="glass space-y-3 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <h2 className="font-semibold">Privacy</h2>
          </div>
          {privacy.map(({ key, label, hint }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-2xl bg-background/40 p-3"
            >
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} aria-label={label} />
            </div>
          ))}
        </section>

        {/* Account section */}
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-3 font-semibold">Account</h2>
          <p className="mb-4 text-sm text-muted-foreground">Signed in as {user.email}</p>
          <Button variant="outline" onClick={signOut} className="rounded-full">
            <LogOut className="size-4" /> Sign out
          </Button>
        </section>

        <div className="pb-10" />
      </main>
    </div>
  );
}
