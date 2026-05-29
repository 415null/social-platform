import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Toggle like/unlike
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json();
  const supabase = createServerClient();

  if (action === "like") {
    await supabase.from("video_likes").upsert({
      video_id: Number(id),
      user_id: session.id,
    });
  } else if (action === "unlike") {
    await supabase
      .from("video_likes")
      .delete()
      .eq("video_id", Number(id))
      .eq("user_id", session.id);
  } else if (action === "favorite") {
    await supabase.from("video_favorites").upsert({
      video_id: Number(id),
      user_id: session.id,
    });
  } else if (action === "unfavorite") {
    await supabase
      .from("video_favorites")
      .delete()
      .eq("video_id", Number(id))
      .eq("user_id", session.id);
  }

  return NextResponse.json({ success: true });
}
