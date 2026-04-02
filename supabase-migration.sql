-- ================================================================
-- 狂小說網 · Supabase Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ================================================================

-- ── Tables ──────────────────────────────────────────────────────

CREATE TABLE reading_progress (
  user_id     TEXT        NOT NULL,
  story_slug  TEXT        NOT NULL,
  pct         SMALLINT    NOT NULL DEFAULT 0
                CHECK (pct BETWEEN 0 AND 100),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_slug)
);

CREATE TABLE bookmarks (
  user_id     TEXT        NOT NULL,
  story_slug  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_slug)
);

CREATE TABLE likes (
  user_id     TEXT        NOT NULL,
  story_slug  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_slug)
);

CREATE TABLE story_stats (
  story_slug  TEXT        PRIMARY KEY,
  views       INTEGER     NOT NULL DEFAULT 0,
  likes       INTEGER     NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  story_slug  TEXT        NOT NULL,
  body        TEXT        NOT NULL
                CONSTRAINT body_length CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────

CREATE INDEX idx_rp_user      ON reading_progress (user_id);
CREATE INDEX idx_bm_user      ON bookmarks (user_id);
CREATE INDEX idx_lk_user      ON likes (user_id);
CREATE INDEX idx_cm_story     ON comments (story_slug, created_at DESC);
CREATE INDEX idx_cm_user      ON comments (user_id);

-- ── Row Level Security ───────────────────────────────────────────
-- Clerk JWT: `sub` claim = user_id
-- Configure Supabase → Authentication → JWT Settings → JWT Secret
-- using your Clerk JWT public key (JWKS endpoint)

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;

-- Helper: extract Clerk user_id from JWT sub claim
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json ->> 'sub', ''
  );
$$;

-- reading_progress
CREATE POLICY "rp_select" ON reading_progress
  FOR SELECT USING (user_id = requesting_user_id());
CREATE POLICY "rp_insert" ON reading_progress
  FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "rp_update" ON reading_progress
  FOR UPDATE USING (user_id = requesting_user_id());

-- bookmarks
CREATE POLICY "bm_all" ON bookmarks
  FOR ALL USING (user_id = requesting_user_id());

-- likes
CREATE POLICY "lk_all" ON likes
  FOR ALL USING (user_id = requesting_user_id());

-- story_stats: public read; service role handles writes
CREATE POLICY "ss_read" ON story_stats
  FOR SELECT USING (true);

-- comments: public read, authenticated insert, own delete
CREATE POLICY "cm_read"   ON comments FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON comments
  FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "cm_delete" ON comments
  FOR DELETE USING (user_id = requesting_user_id());

-- ── Stored Functions ─────────────────────────────────────────────

-- Atomically increment view count
CREATE OR REPLACE FUNCTION increment_story_views(slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO story_stats (story_slug, views)
  VALUES (slug, 1)
  ON CONFLICT (story_slug)
  DO UPDATE SET
    views      = story_stats.views + 1,
    updated_at = now();
END;
$$;

-- Atomically increment like count
CREATE OR REPLACE FUNCTION increment_likes(slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO story_stats (story_slug, likes)
  VALUES (slug, 1)
  ON CONFLICT (story_slug)
  DO UPDATE SET
    likes      = story_stats.likes + 1,
    updated_at = now();
END;
$$;

-- Atomically decrement like count (floor at 0)
CREATE OR REPLACE FUNCTION decrement_likes(slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE story_stats
  SET likes      = GREATEST(0, likes - 1),
      updated_at = now()
  WHERE story_slug = slug;
END;
$$;

-- ── Rate-limit query (used in API route, not enforced by DB) ──────
-- SELECT COUNT(*) FROM comments
-- WHERE user_id = $1
--   AND created_at > now() - interval '1 hour';
-- Returns ≥ 5 → reject with 429.

-- ================================================================
-- Clerk + Supabase JWT Integration Setup:
-- 1. Go to clerk.com → Configure → JWT Templates → New template
-- 2. Template name: supabase
-- 3. Claims: { "sub": "{{user.id}}" }
-- 4. Copy the JWKS URL from Clerk
-- 5. In Supabase: Authentication → JWT Settings
--    → Set JWT Secret type to "JWKS URL"
--    → Paste the Clerk JWKS URL
-- ================================================================
