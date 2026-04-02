import { createClient } from '@supabase/supabase-js';

// Service role client for server-side API routes (bypasses RLS — verified by Clerk auth)
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Anon client for client-side usage
export const supabaseAnon = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

// ---- Reading Progress ----

export async function getProgress(userId: string, storySlug: string) {
  const { data } = await supabase
    .from('reading_progress')
    .select('pct')
    .eq('user_id', userId)
    .eq('story_slug', storySlug)
    .single();
  return data?.pct ?? 0;
}

export async function upsertProgress(userId: string, storySlug: string, pct: number) {
  await supabase.from('reading_progress').upsert(
    { user_id: userId, story_slug: storySlug, pct, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,story_slug' },
  );
}

export async function getUserHistory(userId: string) {
  const { data } = await supabase
    .from('reading_progress')
    .select('story_slug, pct, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return data ?? [];
}

// ---- Bookmarks ----

export async function getBookmarks(userId: string) {
  const { data } = await supabase
    .from('bookmarks')
    .select('story_slug, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function isBookmarked(userId: string, storySlug: string) {
  const { data } = await supabase
    .from('bookmarks')
    .select('story_slug')
    .eq('user_id', userId)
    .eq('story_slug', storySlug)
    .single();
  return !!data;
}

export async function addBookmark(userId: string, storySlug: string) {
  await supabase.from('bookmarks').upsert({ user_id: userId, story_slug: storySlug });
}

export async function removeBookmark(userId: string, storySlug: string) {
  await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('story_slug', storySlug);
}

// ---- Likes ----

export async function isLiked(userId: string, storySlug: string) {
  const { data } = await supabase
    .from('likes')
    .select('story_slug')
    .eq('user_id', userId)
    .eq('story_slug', storySlug)
    .single();
  return !!data;
}

export async function getLikedSlugs(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('likes')
    .select('story_slug')
    .eq('user_id', userId);
  return (data ?? []).map((r) => r.story_slug);
}

export async function toggleLike(userId: string, storySlug: string) {
  const liked = await isLiked(userId, storySlug);
  if (liked) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('story_slug', storySlug);
    await supabase.rpc('decrement_likes', { slug: storySlug });
  } else {
    await supabase.from('likes').upsert({ user_id: userId, story_slug: storySlug });
    await supabase.rpc('increment_likes', { slug: storySlug });
  }
  return !liked;
}

// ---- Story Stats ----

export async function getStoryStats(storySlug: string) {
  const { data } = await supabase
    .from('story_stats')
    .select('views, likes')
    .eq('story_slug', storySlug)
    .single();
  return { views: data?.views ?? 0, likes: data?.likes ?? 0 };
}

export async function incrementViews(storySlug: string) {
  await supabase.rpc('increment_story_views', { slug: storySlug });
}

export async function getGlobalStats() {
  const { data } = await supabase.from('story_stats').select('views, likes');
  if (!data) return { views: 0, likes: 0 };
  return {
    views: data.reduce((s, r) => s + (r.views ?? 0), 0),
    likes: data.reduce((s, r) => s + (r.likes ?? 0), 0),
  };
}

// ---- Comments ----

export async function getComments(storySlug: string) {
  const { data } = await supabase
    .from('comments')
    .select('id, user_id, body, created_at')
    .eq('story_slug', storySlug)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function countRecentComments(userId: string) {
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  return count ?? 0;
}

export async function addComment(userId: string, storySlug: string, body: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, story_slug: storySlug, body })
    .select('id, user_id, body, created_at')
    .single();
  if (error) throw error;
  return data;
}
