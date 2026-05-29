import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// List posts
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  let query = supabase
    .from("posts")
    .select(
      "id, title, content, author_id, category_id, views, created_at, users!posts_author_id_fkey(username, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) {
    query = query.eq("category_id", Number(categoryId));
  }

  const { data: posts } = await query;

  return NextResponse.json({ posts: posts ?? [] });
}

// Create a post
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content, categoryId, imageUrls } = await request.json();

  if (!title || !content || !categoryId) {
    return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: session.id,
      category_id: Number(categoryId),
      title,
      content,
      image_urls: imageUrls ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "发帖失败" }, { status: 500 });
  }

  return NextResponse.json({ post });
}
