import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Search users by ID or username
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  const supabase = createServerClient();

  // Try numeric search (by ID)
  const idSearch = Number(q);
  let query = supabase.from("users").select("id, username, avatar_url");

  if (!isNaN(idSearch)) {
    query = query
      .or(`id.eq.${idSearch},username.ilike.%${q}%`)
      .neq("id", session.id)
      .limit(20);
  } else {
    query = query
      .ilike("username", `%${q}%`)
      .neq("id", session.id)
      .limit(20);
  }

  const { data: users } = await query;

  return NextResponse.json({ users: users ?? [] });
}
