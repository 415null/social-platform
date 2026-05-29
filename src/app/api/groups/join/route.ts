import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Join a group
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { groupId } = await request.json();

  const supabase = createServerClient();

  // Check group
  const { data: group } = await supabase
    .from("groups")
    .select("id, visibility")
    .eq("id", Number(groupId))
    .maybeSingle();

  if (!group) {
    return NextResponse.json({ error: "群不存在" }, { status: 404 });
  }

  if (group.visibility === "invite_only") {
    return NextResponse.json(
      { error: "此群仅支持邀请加入" },
      { status: 403 },
    );
  }

  // Check existing membership
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", Number(groupId))
    .eq("user_id", session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "你已在群中" }, { status: 409 });
  }

  const { error } = await supabase.from("group_members").insert({
    group_id: Number(groupId),
    user_id: session.id,
    role: "member",
  });

  if (error) {
    return NextResponse.json({ error: "加入失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
