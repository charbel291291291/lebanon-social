import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const BUCKET = "profile-media";

const signedCache = new Map<string, string>();

/** Profile media lives in a private bucket, so resolve storage paths to signed URLs. */
export async function resolveMedia(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cached = signedCache.get(path);
  if (cached) return cached;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (!data?.signedUrl) return null;
  signedCache.set(path, data.signedUrl);
  return data.signedUrl;
}

export async function uploadProfileMedia(userId: string, kind: "avatar" | "cover", file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 24);
}

export async function ensureProfile(userId: string, email: string | undefined) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing as Profile;

  const base = slugifyUsername(email?.split("@")[0] || "yalla") || "yalla";
  const username = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, username, full_name: base })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}