import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ImagePlus, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/yalla/top-bar";
import { ProfileView } from "@/components/yalla/profile-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { governorates } from "@/lib/yalla-data";
import { ensureProfile, slugifyUsername, uploadProfileMedia, type Profile } from "@/lib/profile";

const title = "Your profile settings — FaceLeb";
const description =
  "Edit your FaceLeb profile: cover photo, avatar, bio, governorate and privacy settings.";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

  const { data } = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => ensureProfile(user.id, user.email ?? undefined),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const pick = async (kind: "avatar" | "cover", file?: File) => {
    if (!file || !form) return;
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
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: form.full_name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        cover_url: form.cover_url,
        governorate: form.governorate,
        website: form.website,
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
        <main className="mx-auto max-w-3xl px-4 py-6">
          <div className="glass h-72 animate-pulse rounded-3xl" />
        </main>
      </div>
    );
  }

  const privacy = [
    {
      key: "is_private" as const,
      label: "Private profile",
      hint: "Only you can view your profile page.",
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
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <ProfileView profile={form} isOwner={false} />

        <section className="glass space-y-5 rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold">
              Edit profile
            </h2>
            {form.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                <BadgeCheck className="size-4" /> Verified
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["cover", "avatar"] as const).map((kind) => (
              <div key={kind} className="space-y-1.5">
                <Label htmlFor={`${kind}-file`}>
                  {kind === "cover" ? "Cover photo" : "Avatar"}
                </Label>
                <label
                  htmlFor={`${kind}-file`}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                >
                  {uploading === kind ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  Upload image
                </label>
                <input
                  id={`${kind}-file`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => pick(kind, e.target.files?.[0])}
                />
              </div>
            ))}
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
              value={form.bio}
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
        </section>

        <section className="glass space-y-3 rounded-3xl p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold">
            Privacy
          </h2>
          {privacy.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-background/40 p-3">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={form[key]}
                onCheckedChange={(v) => set(key, v)}
                aria-label={label}
              />
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-2 pb-10">
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving && <Loader2 className="size-4 animate-spin" />} Save changes
          </Button>
          <Button variant="outline" onClick={signOut} className="rounded-full">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </main>
    </div>
  );
}