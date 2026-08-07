import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const BUCKET = "profile-media";

// Signed URLs expire after 1 h — cache them with a TTL so we re-sign before expiry
const SIGNED_TTL_MS = 55 * 60 * 1000; // re-sign 5 min before the 1-h expiry
const signedCache = new Map<string, { url: string; expiresAt: number }>();

/** Profile media lives in a private bucket, so resolve storage paths to signed URLs. */
export async function resolveMedia(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const entry = signedCache.get(path);
  if (entry && Date.now() < entry.expiresAt) return entry.url;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (!data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_TTL_MS });
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
