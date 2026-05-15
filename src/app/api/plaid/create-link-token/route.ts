import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { validateOrigin } from "@/lib/csrf";
import { CountryCode, Products } from "plaid";

export async function POST(request: Request) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Centsible",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err: any) {
    console.error("Plaid create-link-token error:", err?.response?.data || err?.message);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
