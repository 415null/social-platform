import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// List groups (with search)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const my = searchParams.get("my");

  const supabase = createServerClient();

  let query = supabase.from("groups").select(
    "id, group_number, name, description, owner_id, avatar_url, visibility, created_at",
  );

  if (q) {
    if (!isNaN(Number(q))) {
      query = query
        .or(`group_number.eq.${Number(q)},name.ilike.%${q}%`)
        .order("created_at", { ascending: false });
    } else {
      query = query.ilike("name", `%${q}%`).order("created_at", {
        ascending: false,
      });
    }
  } else if (my === "true") {
    // Groups I'm a member of
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", session.id);

    if (memberships?.length) {
      query = query
        .in(
          "id",
          memberships.map((m) => m.group_id),
        )
        .order("created_at", { ascending: false });
    }
  } else {
    query = query.order("created_at", { ascending: false }).limit(50);
  }

  const { data: groups } = await query;

  return NextResponse.json({ groups: groups ?? [] });
}

// Create a group
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name, description, visibility } = await request.json();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "群名称至少2个字符" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Generate a unique group number
  let groupNumber: number;
  for (let i = 0; i < 10; i++) {
    groupNumber = Math.floor(100000 + Math.random() * 900000);
    const { data: exists } = await supabase
      .from("groups")
      .select("id")
      .eq("group_number", groupNumber)
      .maybeSingle();
    if (!exists) break;
  }

  // Create group
  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name,
      description,
      visibility: visibility ?? "public",
      owner_id: session.id,
      group_number: groupNumber!,
    })
    .select()
    .single();

  if (error || !group) {
    return NextResponse.json({ error: "创建群失败" }, { status: 500 });
  }

  // Add owner as member
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: session.id,
    role: "owner",
  });

  return NextResponse.json({ group });
}
