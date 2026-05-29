import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// List friends
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const supabase = createServerClient();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_id_1, user_id_2")
    .or(`user_id_1.eq.${session.id},user_id_2.eq.${session.id}`);

  if (!friendships?.length) {
    return NextResponse.json({ friends: [], requests: [] });
  }

  const friendIds = friendships.map((f) =>
    f.user_id_1 === session.id ? f.user_id_2 : f.user_id_1,
  );

  const { data: friends } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .in("id", friendIds);

  // Also get pending requests
  const { data: incoming } = await supabase
    .from("friend_requests")
    .select("id, sender_id, created_at")
    .eq("receiver_id", session.id)
    .eq("status", "pending");

  const { data: outgoing } = await supabase
    .from("friend_requests")
    .select("id, receiver_id, created_at")
    .eq("sender_id", session.id)
    .eq("status", "pending");

  // Get user info for requesters
  const requestUserIds = [
    ...(incoming?.map((r) => r.sender_id) ?? []),
    ...(outgoing?.map((r) => r.receiver_id) ?? []),
  ];

  const { data: requestUsers } = requestUserIds.length
    ? await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", requestUserIds)
    : { data: [] };

  const userMap = new Map((requestUsers ?? []).map((u) => [u.id, u]));

  return NextResponse.json({
    friends: friends ?? [],
    incoming:
      incoming?.map((r) => ({
        id: r.id,
        user: userMap.get(r.sender_id),
        created_at: r.created_at,
      })) ?? [],
    outgoing:
      outgoing?.map((r) => ({
        id: r.id,
        user: userMap.get(r.receiver_id),
        created_at: r.created_at,
      })) ?? [],
  });
}

// Remove friend
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { friendId } = await request.json();

  const supabase = createServerClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id_1.eq.${Math.min(session.id, Number(friendId))},user_id_2.eq.${Math.max(session.id, Number(friendId))})`,
    );

  if (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
