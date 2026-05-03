import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { encrypt } from "@/lib/crypto";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { user, supabase, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Validate state to prevent CSRF
  const cookieStore = await cookies();
  const savedState = cookieStore.get("splitwise_oauth_state")?.value;
  cookieStore.delete("splitwise_oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL("/settings?error=invalid_state", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://secure.splitwise.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SPLITWISE_CONSUMER_KEY!,
        client_secret: process.env.SPLITWISE_CONSUMER_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/splitwise/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", request.url));
    }

    // Encrypt and store the token
    const encryptedToken = encrypt(tokenData.access_token);

    await supabase.from("profiles").update({
      // Store in a JSONB column or a dedicated integrations table
      // For now, we'll use the profiles table with a new column
    }).eq("id", user.id);

    // Store in a simple key-value approach using the existing schema
    // We'll use an upsert to a user_integrations concept
    // For MVP: store encrypted token in localStorage via response
    // Better: add a user_integrations table

    return NextResponse.redirect(
      new URL(`/settings?splitwise=connected&token=${encryptedToken}`, request.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/settings?error=splitwise_failed", request.url));
  }
}
