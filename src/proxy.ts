import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const publicPaths = ["/login", "/register", "/api/auth"];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = publicPaths.some((p) => path.startsWith(p));

  const token = request.cookies.get("auth-token")?.value;
  const user = token ? await verifyToken(token) : null;

  if (isPublic && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublic && !user) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url),
    );
  }

  return NextResponse.next();
}

