import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json(
        { error: "ID和密码不能为空" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: user } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .eq("id", Number(id))
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: "ID或密码错误" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "ID或密码错误" },
        { status: 401 },
      );
    }

    await setSession({ id: user.id, username: user.username });

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 },
    );
  }
}
