import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, content, image_urls, author_id, category_id, views, created_at, users!posts_author_id_fkey(username, avatar_url)",
    )
    .eq("id", Number(id))
    .single();

  if (!post) {
    return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
  }

  // Increment views
  await supabase
    .from("posts")
    .update({ views: (post as unknown as { views: number }).views + 1 })
    .eq("id", Number(id));

  // Get comments
  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id, content, author_id, parent_id, created_at, users!comments_author_id_fkey(username, avatar_url)",
    )
    .eq("entity_type", "post")
    .eq("entity_id", Number(id))
    .order("created_at", { ascending: true });

  return NextResponse.json({
    post,
    comments: comments ?? [],
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", Number(id))
    .single();

  if (!post || post.author_id !== session.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await supabase.from("posts").delete().eq("id", Number(id));

  return NextResponse.json({ success: true });
}
