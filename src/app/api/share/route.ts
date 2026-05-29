import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

// Forward a video/post to a chat
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { type, entityId, entityTitle, entityUrl, receiverId, groupId } =
    await request.json();

  if (!type || !entityId) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const supabase = createServerClient();

  const forwardRef = { type, entityId, entityTitle, entityUrl };

  if (groupId) {
    const { error } = await supabase.from("messages").insert({
      sender_id: session.id,
      group_id: Number(groupId),
      type: "forward",
      forward_ref: forwardRef,
    });

    if (error) {
      return NextResponse.json({ error: "转发失败" }, { status: 500 });
    }
  } else if (receiverId) {
    const { error } = await supabase.from("messages").insert({
      sender_id: session.id,
      receiver_id: Number(receiverId),
      type: "forward",
      forward_ref: forwardRef,
    });

    if (error) {
      return NextResponse.json({ error: "转发失败" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
