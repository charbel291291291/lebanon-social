/**
 * Admin server functions.
 * Every function:
 *  1. Requires the caller to be authenticated (requireSupabaseAuth middleware).
 *  2. Asserts the caller has is_admin = true on their profile.
 *  3. Uses supabaseAdmin (service_role) — bypasses RLS entirely.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ── Shared helpers (run server-side only via dynamic import) ─────

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(userId: string) {
  const db = await adminClient();
  const { data, error } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  if (error || !data?.is_admin) throw new Error("Forbidden");
  return db;
}

// ── Access check (called from admin route beforeLoad) ─────────────

export const adminCheckAccess = createServerFn()
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return { ok: true };
  });

// ── Dashboard ─────────────────────────────────────────────────────

export const adminGetStats = createServerFn()
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [
      { count: totalUsers },
      { count: newUsers },
      { count: totalPosts },
      { count: newPosts },
      { count: totalComments },
      { count: totalCommunities },
      { count: totalEvents },
      { count: activeListings },
      { count: verifiedBiz },
      { data: recentPosts },
      { data: recentUsers },
    ] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      db.from("posts").select("*", { count: "exact", head: true }),
      db.from("posts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      db.from("comments").select("*", { count: "exact", head: true }),
      db.from("communities").select("*", { count: "exact", head: true }),
      db.from("events").select("*", { count: "exact", head: true }),
      db.from("marketplace_listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      db.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", true),
      db
        .from("posts")
        .select("id, body, tag, created_at, author:profiles!posts_author_id_fkey(username, full_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      db
        .from("profiles")
        .select("id, username, full_name, is_verified, is_admin, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      totalUsers: totalUsers ?? 0,
      newUsers: newUsers ?? 0,
      totalPosts: totalPosts ?? 0,
      newPosts: newPosts ?? 0,
      totalComments: totalComments ?? 0,
      totalCommunities: totalCommunities ?? 0,
      totalEvents: totalEvents ?? 0,
      activeListings: activeListings ?? 0,
      verifiedBiz: verifiedBiz ?? 0,
      recentPosts: (recentPosts ?? []) as Array<{
        id: string;
        body: string;
        tag: string;
        created_at: string;
        author: { username: string; full_name: string } | null;
      }>,
      recentUsers: (recentUsers ?? []) as Array<{
        id: string;
        username: string;
        full_name: string;
        is_verified: boolean;
        is_admin: boolean;
        created_at: string;
      }>,
    };
  });

// ── Users ─────────────────────────────────────────────────────────

export const adminGetUsers = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string; page?: number }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const limit = 25;
    const offset = (data.page ?? 0) * limit;

    let q = db
      .from("profiles")
      .select(
        "id, username, full_name, governorate, is_verified, is_admin, is_private, searchable, allow_messages, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data.search) {
      q = q.or(`username.ilike.%${data.search}%,full_name.ilike.%${data.search}%`);
    }

    const { data: users, count, error } = await q;
    if (error) throw error;
    return { users: users ?? [], count: count ?? 0 };
  });

export const adminUpdateUser = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator(
    (d: { id: string; is_verified?: boolean; is_admin?: boolean; is_private?: boolean }) => d,
  )
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { id, ...fields } = data;
    const { error } = await db.from("profiles").update(fields).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Posts ─────────────────────────────────────────────────────────

export const adminGetPosts = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string; tag?: string; page?: number }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const limit = 25;
    const offset = (data.page ?? 0) * limit;

    let q = db
      .from("posts")
      .select(
        "id, body, tag, governorate, place, created_at, author:profiles!posts_author_id_fkey(id, username, full_name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data.search) q = q.ilike("body", `%${data.search}%`);
    if (data.tag && data.tag !== "all") q = q.eq("tag", data.tag);

    const { data: posts, count, error } = await q;
    if (error) throw error;
    return { posts: posts ?? [], count: count ?? 0 };
  });

export const adminDeletePost = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("posts").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Comments ──────────────────────────────────────────────────────

export const adminGetComments = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string; page?: number }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const limit = 25;
    const offset = (data.page ?? 0) * limit;

    let q = db
      .from("comments")
      .select(
        "id, body, created_at, author:profiles!comments_author_id_fkey(id, username, full_name), post:posts!comments_post_id_fkey(id, body)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data.search) q = q.ilike("body", `%${data.search}%`);

    const { data: comments, count, error } = await q;
    if (error) throw error;
    return { comments: comments ?? [], count: count ?? 0 };
  });

export const adminDeleteComment = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("comments").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Communities ───────────────────────────────────────────────────

export const adminGetCommunities = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);

    let q = db
      .from("communities")
      .select(
        "id, name, type, governorate, description, created_at, creator:profiles!communities_created_by_fkey(username, full_name), community_members(count)",
      )
      .order("created_at", { ascending: false });

    if (data.search) q = q.ilike("name", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminDeleteCommunity = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("communities").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Events ────────────────────────────────────────────────────────

export const adminGetEvents = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);

    let q = db
      .from("events")
      .select(
        "id, title, place, governorate, starts_at, ends_at, created_at, creator:profiles!events_created_by_fkey(username, full_name), event_attendees(count)",
      )
      .order("starts_at", { ascending: false });

    if (data.search) q = q.ilike("title", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminDeleteEvent = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("events").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Marketplace ───────────────────────────────────────────────────

export const adminGetListings = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string; status?: string; page?: number }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const limit = 25;
    const offset = (data.page ?? 0) * limit;

    let q = db
      .from("marketplace_listings")
      .select(
        "id, title, price, currency, category, condition, status, seller_id, governorate, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);

    const { data: listings, count, error } = await q;
    if (error) throw error;

    // Resolve seller profiles (seller_id → auth.users ≈ profiles.id)
    const ids = [...new Set((listings ?? []).map((l) => l.seller_id).filter(Boolean))];
    const sellerMap: Record<string, { username: string; full_name: string }> = {};
    if (ids.length) {
      const { data: sellers } = await db
        .from("profiles")
        .select("id, username, full_name")
        .in("id", ids);
      for (const s of sellers ?? []) sellerMap[s.id] = s;
    }

    return {
      listings: (listings ?? []).map((l) => ({
        ...l,
        seller: sellerMap[l.seller_id ?? ""] ?? null,
      })),
      count: count ?? 0,
    };
  });

export const adminUpdateListing = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db
      .from("marketplace_listings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteListing = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("marketplace_listings").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Businesses ────────────────────────────────────────────────────

export const adminGetBusinesses = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);

    let q = db
      .from("businesses")
      .select("id, name, category, description, governorate, phone, website, is_verified, owner_id, created_at")
      .order("created_at", { ascending: false });

    if (data.search) q = q.ilike("name", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;

    // Resolve owner profiles
    const ids = [...new Set((rows ?? []).map((b) => b.owner_id).filter(Boolean))];
    const ownerMap: Record<string, { username: string; full_name: string }> = {};
    if (ids.length) {
      const { data: owners } = await db
        .from("profiles")
        .select("id, username, full_name")
        .in("id", ids);
      for (const o of owners ?? []) ownerMap[o.id] = o;
    }

    return (rows ?? []).map((b) => ({ ...b, owner: ownerMap[b.owner_id ?? ""] ?? null }));
  });

export const adminUpdateBusiness = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; is_verified: boolean }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db
      .from("businesses")
      .update({ is_verified: data.is_verified })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteBusiness = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("businesses").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Food Places ───────────────────────────────────────────────────

export const adminGetFood = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);

    let q = db
      .from("food_places")
      .select(
        "id, name, cuisine, description, governorate, address, phone, price_range, rating, is_featured, created_at",
      )
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false });

    if (data.search) q = q.ilike("name", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpdateFood = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; is_featured?: boolean; rating?: number }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { id, ...fields } = data;
    const { error } = await db.from("food_places").update(fields).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteFood = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("food_places").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Tourism Spots ─────────────────────────────────────────────────

export const adminGetTourism = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { search?: string }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);

    let q = db
      .from("tourism_spots")
      .select("id, name, category, description, governorate, address, is_featured, created_at")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.search) q = q.ilike("name", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpdateTourism = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; is_featured?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { id, ...fields } = data;
    const { error } = await db.from("tourism_spots").update(fields).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteTourism = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("tourism_spots").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ── Trends ────────────────────────────────────────────────────────

export const adminGetTrends = createServerFn()
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const { data, error } = await db
      .from("trends")
      .select("id, tag, post_count, updated_at")
      .order("post_count", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminDeleteTrend = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("trends").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
