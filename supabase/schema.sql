-- ============================================================
-- Schema for Social Platform (QQ/WeChat/Bilibili hybrid)
-- Run this in Supabase SQL Editor
-- ============================================================
-- NOTE: This app uses custom auth (9-digit ID). All data access
-- goes through Next.js API routes with service_role key.
-- RLS policies below use broad read access for anon-key realtime
-- subscriptions, while writes are restricted to authenticated
-- sessions handled by the API layer.
-- ============================================================

-- ============================================================
-- 1. USERS (custom auth, 9-digit ID)
-- ============================================================
CREATE TABLE public.users (
  id BIGINT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- ============================================================
-- 2. FRIEND REQUESTS
-- ============================================================
CREATE TABLE public.friend_requests (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friend requests are viewable by authenticated"
  ON public.friend_requests FOR SELECT
  USING (true);

-- ============================================================
-- 3. FRIENDSHIPS
-- ============================================================
CREATE TABLE public.friendships (
  id BIGSERIAL PRIMARY KEY,
  user_id_1 BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id_2 BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friendships viewable by authenticated"
  ON public.friendships FOR SELECT
  USING (true);

-- ============================================================
-- 4. GROUPS
-- ============================================================
CREATE TABLE public.groups (
  id BIGSERIAL PRIMARY KEY,
  group_number BIGINT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'invite_only')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups viewable by everyone"
  ON public.groups FOR SELECT
  USING (true);

-- ============================================================
-- 5. GROUP MEMBERS
-- ============================================================
CREATE TABLE public.group_members (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members viewable by authenticated"
  ON public.group_members FOR SELECT
  USING (true);

-- ============================================================
-- 6. MESSAGES (chat: DM & group)
-- ============================================================
CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'forward')),
  content TEXT,
  media_url TEXT,
  forward_ref JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read messages (needed for Realtime subscriptions)
CREATE POLICY "Messages viewable by authenticated"
  ON public.messages FOR SELECT
  USING (true);

-- ============================================================
-- 7. FORUM CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- ============================================================
-- 8. FORUM POSTS
-- ============================================================
CREATE TABLE public.posts (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

-- ============================================================
-- 9. COMMENTS (posts & videos, nested replies)
-- ============================================================
CREATE TABLE public.comments (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('post', 'video')),
  entity_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

-- ============================================================
-- 10. VIDEOS
-- ============================================================
CREATE TABLE public.videos (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INT,
  likes_count INT DEFAULT 0,
  favorites_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos viewable by everyone"
  ON public.videos FOR SELECT
  USING (true);

-- ============================================================
-- 11. VIDEO LIKES
-- ============================================================
CREATE TABLE public.video_likes (
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"
  ON public.video_likes FOR SELECT
  USING (true);

-- ============================================================
-- 12. VIDEO FAVORITES
-- ============================================================
CREATE TABLE public.video_favorites (
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);

ALTER TABLE public.video_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favorites viewable by everyone"
  ON public.video_favorites FOR SELECT
  USING (true);

-- ============================================================
-- 13. POST LIKES
-- ============================================================
CREATE TABLE public.post_likes (
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id, status);
CREATE INDEX idx_friendships_users ON public.friendships(user_id_1, user_id_2);
CREATE INDEX idx_messages_group ON public.messages(group_id, created_at DESC);
CREATE INDEX idx_messages_dm ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_posts_category ON public.posts(category_id, created_at DESC);
CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_videos_author ON public.videos(author_id, created_at DESC);
CREATE INDEX idx_messages_realtime ON public.messages(created_at);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate a random 9-digit ID (called from API, not from RLS)
CREATE OR REPLACE FUNCTION public.generate_user_id()
RETURNS BIGINT AS $$
DECLARE
  new_id BIGINT;
BEGIN
  LOOP
    new_id := (100000000 + floor(random() * 900000000)::BIGINT);
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_id) THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update likes count trigger
CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_video_likes_count
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

-- Update favorites count trigger
CREATE OR REPLACE FUNCTION public.update_video_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET favorites_count = favorites_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_video_favorites_count
  AFTER INSERT OR DELETE ON public.video_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_video_favorites_count();

-- ============================================================
-- ENABLE REALTIME for messages table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
-- STORAGE BUCKETS
-- Create these via Supabase Dashboard > Storage:
--   avatars       (public read)
--   chat-images   (public read)
--   forum-images  (public read)
--   video-covers  (public read)
--   videos        (public read)
-- ============================================================

-- ============================================================
-- SEED DATA: Default forum categories
-- ============================================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('综合讨论', 'general', '畅所欲言，分享生活', 1),
  ('技术交流', 'tech', '编程、技术、数码', 2),
  ('游戏娱乐', 'gaming', '游戏讨论与分享', 3),
  ('影视音乐', 'media', '电影、音乐、视频创作', 4)
ON CONFLICT (slug) DO NOTHING;
