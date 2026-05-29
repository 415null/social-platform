import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Get messages for a group
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const friendId = searchParams.get("friendId");
  const cursor = searchParams.get("cursor");

  const supabase = createServerClient();

  let query = supabase
    .from("messages")
    .select(
      "id, group_id, sender_id, receiver_id, type, content, media_url, forward_ref, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (groupId) {
    // Verify user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", Number(groupId))
      .eq("user_id", session.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "你不是群成员" }, { status: 403 });
    }

    query = query.eq("group_id", Number(groupId));
  } else if (friendId) {
    // DM: messages between session.user and friendId
    query = query.or(
      `and(sender_id.eq.${session.id},receiver_id.eq.${Number(friendId)}),and(sender_id.eq.${Number(friendId)},receiver_id.eq.${session.id})`,
    );
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: messages } = await query;

  return NextResponse.json({ messages: (messages ?? []).reverse() });
}

// Send a message
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { groupId, receiverId, type, content, mediaUrl, forwardRef } =
    await request.json();

  if (!type || (!groupId && !receiverId)) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      group_id: groupId ? Number(groupId) : null,
      sender_id: session.id,
      receiver_id: receiverId ? Number(receiverId) : null,
      type: type ?? "text",
      content: content ?? null,
      media_url: mediaUrl ?? null,
      forward_ref: forwardRef ?? null,
    })
    .select()
    .single();

  if (error || !message) {
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }

  return NextResponse.json({ message });
}
