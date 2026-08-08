-- ================================================================
-- Grant PostgREST access to all social tables.
-- RLS policies alone are not enough — the anon and authenticated
-- roles also need table-level GRANT to reach PostgREST at all.
-- ================================================================

-- Ensure roles can use the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── Posts ──────────────────────────────────────────────────────
GRANT SELECT                        ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL                           ON public.posts TO service_role;

-- ── Post Reactions ─────────────────────────────────────────────
GRANT SELECT                        ON public.post_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated;
GRANT ALL                           ON public.post_reactions TO service_role;

-- ── Comments ───────────────────────────────────────────────────
GRANT SELECT                        ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL                           ON public.comments TO service_role;

-- ── Polls ──────────────────────────────────────────────────────
GRANT SELECT                        ON public.polls TO anon;
GRANT SELECT, INSERT                ON public.polls TO authenticated;
GRANT ALL                           ON public.polls TO service_role;

-- ── Poll Options ───────────────────────────────────────────────
GRANT SELECT                        ON public.poll_options TO anon;
GRANT SELECT, INSERT                ON public.poll_options TO authenticated;
GRANT ALL                           ON public.poll_options TO service_role;

-- ── Poll Votes ─────────────────────────────────────────────────
GRANT SELECT                        ON public.poll_votes TO anon;
GRANT SELECT, INSERT, UPDATE        ON public.poll_votes TO authenticated;
GRANT ALL                           ON public.poll_votes TO service_role;

-- ── Stories ────────────────────────────────────────────────────
GRANT SELECT                        ON public.stories TO anon;
GRANT SELECT, INSERT, DELETE        ON public.stories TO authenticated;
GRANT ALL                           ON public.stories TO service_role;

-- ── Communities ────────────────────────────────────────────────
GRANT SELECT                        ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE        ON public.communities TO authenticated;
GRANT ALL                           ON public.communities TO service_role;

-- ── Community Members ──────────────────────────────────────────
GRANT SELECT                        ON public.community_members TO anon;
GRANT SELECT, INSERT, DELETE        ON public.community_members TO authenticated;
GRANT ALL                           ON public.community_members TO service_role;

-- ── Events ─────────────────────────────────────────────────────
GRANT SELECT                        ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE        ON public.events TO authenticated;
GRANT ALL                           ON public.events TO service_role;

-- ── Event Attendees ────────────────────────────────────────────
GRANT SELECT                        ON public.event_attendees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO authenticated;
GRANT ALL                           ON public.event_attendees TO service_role;

-- ── Trends ─────────────────────────────────────────────────────
GRANT SELECT                        ON public.trends TO anon;
GRANT SELECT                        ON public.trends TO authenticated;
GRANT ALL                           ON public.trends TO service_role;

-- ── Marketplace Listings ───────────────────────────────────────
GRANT SELECT                        ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL                           ON public.marketplace_listings TO service_role;

-- ── Businesses ─────────────────────────────────────────────────
GRANT SELECT                        ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE        ON public.businesses TO authenticated;
GRANT ALL                           ON public.businesses TO service_role;

-- ── Food Places ────────────────────────────────────────────────
GRANT SELECT                        ON public.food_places TO anon;
GRANT SELECT, INSERT                ON public.food_places TO authenticated;
GRANT ALL                           ON public.food_places TO service_role;

-- ── Tourism Spots ──────────────────────────────────────────────
GRANT SELECT                        ON public.tourism_spots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tourism_spots TO authenticated;
GRANT ALL                           ON public.tourism_spots TO service_role;
