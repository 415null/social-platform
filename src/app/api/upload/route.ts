import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

const VALID_BUCKETS = ["chat-images", "forum-images", "avatars", "video-covers"] as const;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file || !bucket) {
    return NextResponse.json({ error: "缺少文件或bucket参数" }, { status: 400 });
  }

  if (!VALID_BUCKETS.includes(bucket as typeof VALID_BUCKETS[number])) {
    return NextResponse.json({ error: "无效的存储桶" }, { status: 400 });
  }

  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: "仅支持 JPG/PNG/GIF/WebP" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "文件大小不能超过10MB" }, { status: 400 });
  }

  const supabase = createServerClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: `上传失败: ${error.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
