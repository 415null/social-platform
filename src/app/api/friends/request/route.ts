import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Send a friend request
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id: receiverId } = await request.json();
  if (!receiverId) {
    return NextResponse.json({ error: "请指定用户ID" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check if receiver exists
  const { data: receiver } = await supabase
    .from("users")
    .select("id")
    .eq("id", Number(receiverId))
    .maybeSingle();

  if (!receiver) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Check if already friends
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id_1.eq.${session.id},user_id_2.eq.${Number(receiverId)}),and(user_id_1.eq.${Number(receiverId)},user_id_2.eq.${session.id})`,
    )
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "已经是好友" }, { status: 409 });
  }

  // Check for existing pending request
  const { data: pending } = await supabase
    .from("friend_requests")
    .select("id, status")
    .or(
      `and(sender_id.eq.${session.id},receiver_id.eq.${Number(receiverId)}),and(sender_id.eq.${Number(receiverId)},receiver_id.eq.${session.id})`,
    )
    .maybeSingle();

  if (pending) {
    if (pending.status === "pending") {
      return NextResponse.json({ error: "已有待处理的好友请求" }, { status: 409 });
    }
    // Re-send if previous was rejected
    await supabase
      .from("friend_requests")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", pending.id);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: session.id,
    receiver_id: Number(receiverId),
  });

  if (error) {
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Accept or reject a friend request
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { requestId, action } = await request.json();
  if (!requestId || !["accepted", "rejected"].includes(action)) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get the request
  const { data: fr } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", Number(requestId))
    .eq("receiver_id", session.id)
    .maybeSingle();

  if (!fr) {
    return NextResponse.json({ error: "请求不存在" }, { status: 404 });
  }

  if (action === "accepted") {
    // Create friendship
    const { error: insertError } = await supabase.from("friendships").insert({
      user_id_1: Math.min(fr.sender_id, fr.receiver_id),
      user_id_2: Math.max(fr.sender_id, fr.receiver_id),
    });

    if (insertError) {
      return NextResponse.json({ error: "操作失败" }, { status: 500 });
    }
  }

  // Update request status
  await supabase
    .from("friend_requests")
    .update({ status: action, updated_at: new Date().toISOString() })
    .eq("id", Number(requestId));

  return NextResponse.json({ success: true });
}
