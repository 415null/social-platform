import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const [videoResult, likesResult, favoriteResult, commentsResult] =
    await Promise.all([
      supabase
        .from("videos")
        .select(
          "id, title, description, video_url, thumbnail_url, duration, author_id, likes_count, favorites_count, comments_count, views, created_at, users!videos_author_id_fkey(username, avatar_url)",
        )
        .eq("id", Number(id))
        .single(),
      supabase
        .from("video_likes")
        .select("video_id")
        .eq("video_id", Number(id))
        .eq("user_id", session.id)
        .maybeSingle(),
      supabase
        .from("video_favorites")
        .select("video_id")
        .eq("video_id", Number(id))
        .eq("user_id", session.id)
        .maybeSingle(),
      supabase
        .from("comments")
        .select(
          "id, content, author_id, parent_id, created_at, users!comments_author_id_fkey(username, avatar_url)",
        )
        .eq("entity_type", "video")
        .eq("entity_id", Number(id))
        .order("created_at", { ascending: true }),
    ]);

  if (!videoResult.data) {
    return NextResponse.json({ error: "视频不存在" }, { status: 404 });
  }

  // Increment views
  await supabase
    .from("videos")
    .update({ views: (videoResult.data.views ?? 0) + 1 })
    .eq("id", Number(id));

  return NextResponse.json({
    video: videoResult.data,
    isLiked: !!likesResult.data,
    isFavorited: !!favoriteResult.data,
    comments: commentsResult.data ?? [],
  });
}
