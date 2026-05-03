import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const state = randomBytes(32).toString("hex");

  // Store state in a cookie to validate on callback
  const cookieStore = await cookies();
  cookieStore.set("splitwise_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPLITWISE_CONSUMER_KEY!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/splitwise/callback`,
    state,
  });

  return NextResponse.redirect(
    `https://secure.splitwise.com/oauth/authorize?${params.toString()}`
  );
}
