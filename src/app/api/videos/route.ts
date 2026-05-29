import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// List videos
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  const { data: videos } = await supabase
    .from("videos")
    .select(
      "id, title, description, thumbnail_url, duration, author_id, likes_count, favorites_count, comments_count, views, created_at, users!videos_author_id_fkey(username, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ videos: videos ?? [] });
}

// Upload a video
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, description, videoUrl, thumbnailUrl, duration } =
    await request.json();

  if (!title || !videoUrl) {
    return NextResponse.json({ error: "标题和视频不能为空" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: video, error } = await supabase
    .from("videos")
    .insert({
      author_id: session.id,
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }

  return NextResponse.json({ video });
}
