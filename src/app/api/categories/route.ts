import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("sort_order");

  return NextResponse.json({ categories: categories ?? [] });
}
