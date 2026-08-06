-- ================================================================
-- FaceLeb — Social schema (posts, reactions, stories, communities,
-- events, trends).  Safe to run multiple times (IF NOT EXISTS).
-- ================================================================

-- ── Posts ──────────────────────────────────────────────────────
create table if not exists public.posts (
  id          uuid        primary key default gen_random_uuid(),
  author_id   uuid        not null references public.profiles(id) on delete cascade,
  body        text        not null,
  image_url   text,
  tag         text        not null default 'General',
  place       text,
  governorate text,
  created_at  timestamptz not null default now()
);
alter table public.posts enable row level security;
create index if not exists posts_author_id_idx  on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_insert" on public.posts;
drop policy if exists "posts_update" on public.posts;
drop policy if exists "posts_delete" on public.posts;
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete" on public.posts for delete using (auth.uid() = author_id);

-- ── Post Reactions (one per user per post) ─────────────────────
create table if not exists public.post_reactions (
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  reaction   text        not null check (reaction in ('like','love','cedar','fire','laugh','wow','support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_reactions enable row level security;
drop policy if exists "reactions_select" on public.post_reactions;
drop policy if exists "reactions_insert" on public.post_reactions;
drop policy if exists "reactions_update" on public.post_reactions;
drop policy if exists "reactions_delete" on public.post_reactions;
create policy "reactions_select" on public.post_reactions for select using (true);
create policy "reactions_insert" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "reactions_update" on public.post_reactions for update using (auth.uid() = user_id);
create policy "reactions_delete" on public.post_reactions for delete using (auth.uid() = user_id);

-- ── Comments ────────────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  author_id   uuid        not null references public.profiles(id) on delete cascade,
  body        text        not null,
  created_at  timestamptz not null default now()
);
alter table public.comments enable row level security;
create index if not exists comments_post_id_idx on public.comments(post_id);
drop policy if exists "comments_select" on public.comments;
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_delete" on public.comments;
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = author_id);

-- ── Polls (one per post) ────────────────────────────────────────
create table if not exists public.polls (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade unique,
  question    text        not null,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.polls enable row level security;
drop policy if exists "polls_select" on public.polls;
drop policy if exists "polls_insert" on public.polls;
create policy "polls_select" on public.polls for select using (true);
create policy "polls_insert" on public.polls for insert with check (
  auth.uid() = (select author_id from public.posts where id = post_id)
);

-- ── Poll Options ────────────────────────────────────────────────
create table if not exists public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references public.polls(id) on delete cascade,
  label    text not null,
  position int  not null default 0
);
alter table public.poll_options enable row level security;
drop policy if exists "poll_options_select" on public.poll_options;
drop policy if exists "poll_options_insert" on public.poll_options;
create policy "poll_options_select" on public.poll_options for select using (true);
create policy "poll_options_insert" on public.poll_options for insert with check (
  auth.uid() = (
    select p.author_id from public.posts p
    join public.polls pl on pl.post_id = p.id
    where pl.id = poll_id
  )
);

-- ── Poll Votes (one per user per poll) ─────────────────────────
create table if not exists public.poll_votes (
  poll_id    uuid        not null references public.polls(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  option_id  uuid        not null references public.poll_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
alter table public.poll_votes enable row level security;
drop policy if exists "poll_votes_select" on public.poll_votes;
drop policy if exists "poll_votes_insert" on public.poll_votes;
drop policy if exists "poll_votes_update" on public.poll_votes;
create policy "poll_votes_select" on public.poll_votes for select using (true);
create policy "poll_votes_insert" on public.poll_votes for insert with check (auth.uid() = user_id);
create policy "poll_votes_update" on public.poll_votes for update using (auth.uid() = user_id);

-- ── Stories (expire after 24 h) ─────────────────────────────────
create table if not exists public.stories (
  id          uuid        primary key default gen_random_uuid(),
  author_id   uuid        not null references public.profiles(id) on delete cascade,
  image_url   text        not null,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);
alter table public.stories enable row level security;
create index if not exists stories_expires_at_idx on public.stories(expires_at);
drop policy if exists "stories_select" on public.stories;
drop policy if exists "stories_insert" on public.stories;
drop policy if exists "stories_delete" on public.stories;
create policy "stories_select" on public.stories for select using (expires_at > now());
create policy "stories_insert" on public.stories for insert with check (auth.uid() = author_id);
create policy "stories_delete" on public.stories for delete using (auth.uid() = author_id);

-- ── Communities ──────────────────────────────────────────────────
create table if not exists public.communities (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  type        text        not null default 'General',
  governorate text,
  image_url   text,
  created_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.communities enable row level security;
drop policy if exists "communities_select" on public.communities;
drop policy if exists "communities_insert" on public.communities;
drop policy if exists "communities_update" on public.communities;
create policy "communities_select" on public.communities for select using (true);
create policy "communities_insert" on public.communities for insert with check (auth.uid() = created_by);
create policy "communities_update" on public.communities for update using (auth.uid() = created_by);

-- ── Community Members ────────────────────────────────────────────
create table if not exists public.community_members (
  community_id uuid        not null references public.communities(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  role         text        not null default 'member' check (role in ('admin','moderator','member')),
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);
alter table public.community_members enable row level security;
drop policy if exists "cm_select" on public.community_members;
drop policy if exists "cm_insert" on public.community_members;
drop policy if exists "cm_delete" on public.community_members;
create policy "cm_select" on public.community_members for select using (true);
create policy "cm_insert" on public.community_members for insert with check (auth.uid() = user_id);
create policy "cm_delete" on public.community_members for delete using (auth.uid() = user_id);

-- ── Events ──────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  place       text        not null,
  governorate text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  image_url   text,
  created_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.events enable row level security;
create index if not exists events_starts_at_idx on public.events(starts_at);
drop policy if exists "events_select" on public.events;
drop policy if exists "events_insert" on public.events;
drop policy if exists "events_update" on public.events;
create policy "events_select" on public.events for select using (true);
create policy "events_insert" on public.events for insert with check (auth.uid() = created_by);
create policy "events_update" on public.events for update using (auth.uid() = created_by);

-- ── Event Attendees ──────────────────────────────────────────────
create table if not exists public.event_attendees (
  event_id   uuid        not null references public.events(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  status     text        not null default 'going' check (status in ('going','interested','not_going')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_attendees enable row level security;
drop policy if exists "ea_select" on public.event_attendees;
drop policy if exists "ea_insert" on public.event_attendees;
drop policy if exists "ea_update" on public.event_attendees;
drop policy if exists "ea_delete" on public.event_attendees;
create policy "ea_select" on public.event_attendees for select using (true);
create policy "ea_insert" on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "ea_update" on public.event_attendees for update using (auth.uid() = user_id);
create policy "ea_delete" on public.event_attendees for delete using (auth.uid() = user_id);

-- ── Trends (managed by service / admin) ─────────────────────────
create table if not exists public.trends (
  id         uuid        primary key default gen_random_uuid(),
  tag        text        not null unique,
  post_count int         not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.trends enable row level security;
drop policy if exists "trends_select" on public.trends;
drop policy if exists "trends_upsert" on public.trends;
create policy "trends_select" on public.trends for select using (true);
-- Only service_role (server-side) can write trends
create policy "trends_upsert" on public.trends for all using (auth.role() = 'service_role');
