import { NextResponse } from "next/server";

/**
 * Validates that a request originated from this app by checking the Origin header.
 * Returns a 403 response if the check fails, or null if the request is valid.
 * Use this at the top of all state-changing (POST/PUT/DELETE) API routes.
 */
export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowedOrigin = new URL(appUrl).origin;

  if (!origin || origin !== allowedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
