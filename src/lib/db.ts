/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import type { ReactionKey } from "./yalla-data";

// ── Query keys ──────────────────────────────────────────────────

export const postsQueryKey = (uid?: string) => ["posts", uid ?? "anon"] as const;
export const storiesQueryKey = (uid?: string) => ["stories", uid ?? "anon"] as const;
export const commQueryKey = (uid?: string) => ["communities", uid ?? "anon"] as const;
export const eventsQueryKey = (uid?: string) => ["events", uid ?? "anon"] as const;
export const trendsQueryKey = () => ["trends"] as const;
export const listingsQueryKey = (cat?: string) => ["listings", cat ?? "all"] as const;
export const businessesQueryKey = (cat?: string) => ["businesses", cat ?? "all"] as const;
export const foodQueryKey = (cuisine?: string) => ["food", cuisine ?? "all"] as const;
export const tourismQueryKey = (cat?: string) => ["tourism", cat ?? "all"] as const;

// ── Display types ───────────────────────────────────────────────

export type DbAuthor = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type DbPollOption = {
  id: string;
  label: string;
  position: number;
  vote_count: number;
};

export type DbPoll = {
  id: string;
  question: string;
  options: DbPollOption[];
  my_vote_option_id: string | null;
};

export type DbPost = {
  id: string;
  body: string;
  image_url: string | null;
  tag: string;
  place: string | null;
  governorate: string | null;
  created_at: string;
  author: DbAuthor;
  reaction_counts: Partial<Record<ReactionKey, number>>;
  total_reactions: number;
  comment_count: number;
  my_reaction: ReactionKey | null;
  poll: DbPoll | null;
};

export type DbStory = {
  id: string;
  image_url: string;
  expires_at: string;
  author: DbAuthor;
};

export type DbCommunity = {
  id: string;
  name: string;
  type: string;
  member_count: number;
  is_member: boolean;
};

export type DbEvent = {
  id: string;
  title: string;
  place: string;
  starts_at: string;
  attendee_count: number;
  is_attending: boolean;
};

export type DbTrend = {
  id: string;
  tag: string;
  post_count: number;
};

// ── Client helpers ──────────────────────────────────────────────

const db = supabase as any;

export function getInitials(name: string): string {
  return (
    (name || "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase() || "??"
  );
}

export function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

// ── Queries ─────────────────────────────────────────────────────

export async function fetchPosts(userId?: string): Promise<DbPost[]> {
  const { data, error } = await db
    .from("posts")
    .select(
      `
      id, body, image_url, tag, place, governorate, created_at,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, is_verified),
      post_reactions(reaction, user_id),
      comments(id),
      polls(id, question, poll_options(id, label, position, poll_votes(user_id, option_id)))
    `,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => {
    const rxns: { reaction: string; user_id: string }[] = row.post_reactions ?? [];
    const myRxn = userId
      ? ((rxns.find((r) => r.user_id === userId)?.reaction as ReactionKey) ?? null)
      : null;

    const reactionCounts: Partial<Record<ReactionKey, number>> = {};
    for (const r of rxns) {
      reactionCounts[r.reaction as ReactionKey] =
        (reactionCounts[r.reaction as ReactionKey] ?? 0) + 1;
    }

    const rawPoll = (row.polls ?? [])[0];
    const poll: DbPoll | null = rawPoll
      ? {
          id: rawPoll.id,
          question: rawPoll.question,
          my_vote_option_id: userId
            ? ((rawPoll.poll_options ?? [])
                .flatMap((o: any) => o.poll_votes ?? [])
                .find((v: any) => v.user_id === userId)?.option_id ?? null)
            : null,
          options: ((rawPoll.poll_options ?? []) as any[])
            .sort((a, b) => a.position - b.position)
            .map((o) => ({
              id: o.id,
              label: o.label,
              position: o.position,
              vote_count: (o.poll_votes ?? []).length,
            })),
        }
      : null;

    return {
      id: row.id,
      body: row.body,
      image_url: row.image_url ?? null,
      tag: row.tag,
      place: row.place ?? null,
      governorate: row.governorate ?? null,
      created_at: row.created_at,
      author: row.author,
      reaction_counts: reactionCounts,
      total_reactions: rxns.length,
      comment_count: (row.comments ?? []).length,
      my_reaction: myRxn,
      poll,
    } satisfies DbPost;
  });
}

export async function fetchStories(): Promise<DbStory[]> {
  const { data, error } = await db
    .from("stories")
    .select(
      `
      id, image_url, expires_at,
      author:profiles!stories_author_id_fkey(id, username, full_name, avatar_url, is_verified)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    image_url: row.image_url,
    expires_at: row.expires_at,
    author: row.author,
  }));
}

export async function fetchCommunities(userId?: string): Promise<DbCommunity[]> {
  const { data, error } = await db
    .from("communities")
    .select(`id, name, type, community_members(user_id)`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    member_count: (row.community_members ?? []).length,
    is_member: userId
      ? (row.community_members ?? []).some((m: any) => m.user_id === userId)
      : false,
  }));
}

export async function fetchEvents(userId?: string): Promise<DbEvent[]> {
  const { data, error } = await db
    .from("events")
    .select(`id, title, place, starts_at, event_attendees(user_id, status)`)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    place: row.place,
    starts_at: row.starts_at,
    attendee_count: (row.event_attendees ?? []).filter((a: any) => a.status === "going").length,
    is_attending: userId
      ? (row.event_attendees ?? []).some((a: any) => a.user_id === userId && a.status === "going")
      : false,
  }));
}

export async function fetchTrends(): Promise<DbTrend[]> {
  const { data, error } = await db
    .from("trends")
    .select("id, tag, post_count")
    .order("post_count", { ascending: false })
    .limit(8);

  if (error) throw error;
  return (data as any[]) ?? [];
}

// ── Mutations ────────────────────────────────────────────────────

export async function createPost(
  authorId: string,
  body: string,
  tag: string,
  opts?: { image_url?: string; place?: string; governorate?: string },
): Promise<void> {
  const { error } = await db.from("posts").insert({
    author_id: authorId,
    body,
    tag,
    ...opts,
  });
  if (error) throw error;
}

export async function toggleReaction(
  postId: string,
  userId: string,
  reaction: ReactionKey,
  currentReaction: ReactionKey | null,
): Promise<void> {
  if (currentReaction === reaction) {
    const { error } = await db
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await db
      .from("post_reactions")
      .upsert({ post_id: postId, user_id: userId, reaction });
    if (error) throw error;
  }
}

export async function votePoll(pollId: string, userId: string, optionId: string): Promise<void> {
  const { error } = await db
    .from("poll_votes")
    .upsert({ poll_id: pollId, user_id: userId, option_id: optionId });
  if (error) throw error;
}

export async function joinCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await db
    .from("community_members")
    .insert({ community_id: communityId, user_id: userId });
  if (error) throw error;
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await db
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function rsvpEvent(
  eventId: string,
  userId: string,
  status: "going" | "interested" | "not_going",
): Promise<void> {
  const { error } = await db
    .from("event_attendees")
    .upsert({ event_id: eventId, user_id: userId, status });
  if (error) throw error;
}

// ── Marketplace ──────────────────────────────────────────────────

export type DbListing = {
  id: string;
  seller_id: string;
  seller: DbAuthor;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  category: string;
  condition: string;
  governorate: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
};

export async function fetchListings(category?: string): Promise<DbListing[]> {
  let q = db
    .from("marketplace_listings")
    .select(
      "*, seller:profiles!marketplace_listings_seller_id_fkey(id, username, full_name, avatar_url, is_verified)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);
  if (category) q = (q as any).eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function createListing(
  sellerId: string,
  data: {
    title: string;
    description: string;
    price: number | null;
    currency: string;
    category: string;
    condition: string;
    governorate?: string;
  },
): Promise<void> {
  const { error } = await db.from("marketplace_listings").insert({ seller_id: sellerId, ...data });
  if (error) throw error;
}

// ── Businesses ───────────────────────────────────────────────────

export type DbBusiness = {
  id: string;
  owner_id: string | null;
  name: string;
  category: string;
  description: string;
  governorate: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
};

export async function fetchBusinesses(category?: string): Promise<DbBusiness[]> {
  let q = db
    .from("businesses")
    .select("*")
    .order("is_verified", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);
  if (category) q = (q as any).eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    category: string;
    description: string;
    governorate?: string;
    phone?: string;
    website?: string;
  },
): Promise<void> {
  const { error } = await db.from("businesses").insert({ owner_id: ownerId, ...data });
  if (error) throw error;
}

// ── Food places ──────────────────────────────────────────────────

export type DbFoodPlace = {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  governorate: string | null;
  address: string | null;
  phone: string | null;
  price_range: string;
  image_url: string | null;
  rating: number;
  is_featured: boolean;
};

export async function fetchFoodPlaces(cuisine?: string): Promise<DbFoodPlace[]> {
  let q = db
    .from("food_places")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false })
    .limit(40);
  if (cuisine) q = (q as any).eq("cuisine", cuisine);
  const { data, error } = await q;
  if (error) throw error;
  return (data as any[]) ?? [];
}

// ── Comments ─────────────────────────────────────────────────────

export type DbComment = {
  id: string;
  body: string;
  created_at: string;
  author: DbAuthor;
};

export async function fetchComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await db
    .from("comments")
    .select(
      `
      id, body, created_at,
      author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url, is_verified)
    `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function addComment(postId: string, userId: string, body: string): Promise<DbComment> {
  const { data, error } = await db
    .from("comments")
    .insert({ post_id: postId, author_id: userId, body })
    .select(
      `id, body, created_at, author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url, is_verified)`,
    )
    .single();
  if (error) throw error;
  return data as DbComment;
}

// ── Tourism spots ─────────────────────────────────────────────────

export type DbTourismSpot = {
  id: string;
  name: string;
  category: string;
  description: string;
  governorate: string | null;
  address: string | null;
  image_url: string | null;
  is_featured: boolean;
};

export async function fetchTourismSpots(category?: string): Promise<DbTourismSpot[]> {
  let q = db
    .from("tourism_spots")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);
  if (category) q = (q as any).eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data as any[]) ?? [];
}
