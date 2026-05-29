import { createServerClient } from "@/lib/supabase/server";

export async function generateUniqueId(): Promise<number> {
  const supabase = createServerClient();

  let id: number;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    id = Math.floor(100000000 + Math.random() * 900000000);
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    exists = !!data;
    attempts++;
  }

  if (exists) {
    throw new Error("Failed to generate unique ID");
  }

  return id!;
}
