import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { setSession } from "@/lib/auth";
import { generateUniqueId } from "@/lib/id-generator";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    if (username.length < 2 || username.length > 50) {
      return NextResponse.json(
        { error: "用户名长度需在2-50个字符之间" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少6位" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Check if username is taken
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "用户名已被占用" },
        { status: 409 },
      );
    }

    const id = await generateUniqueId();
    const passwordHash = await bcrypt.hash(password, 12);

    const { error: insertError } = await supabase.from("users").insert({
      id,
      username,
      password_hash: passwordHash,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "注册失败，请重试" },
        { status: 500 },
      );
    }

    await setSession({ id, username });

    return NextResponse.json({
      user: { id, username },
    });
  } catch {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 },
    );
  }
}
