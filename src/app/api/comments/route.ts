import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Create a comment
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { entityType, entityId, content, parentId } = await request.json();

  if (!entityType || !entityId || !content) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      entity_type: entityType,
      entity_id: Number(entityId),
      author_id: session.id,
      content,
      parent_id: parentId ? Number(parentId) : null,
    })
    .select("id, content, author_id, parent_id, created_at, users!comments_author_id_fkey(username, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }

  // Update comment count for videos
  if (entityType === "video") {
    await supabase.rpc("update_video_comments_count", {
      v_id: Number(entityId),
      delta: 1,
    });
  }

  return NextResponse.json({ comment });
}
