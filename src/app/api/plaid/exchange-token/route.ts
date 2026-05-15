import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { validateOrigin } from "@/lib/csrf";
import { encrypt } from "@/lib/crypto";

export async function POST(request: Request) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const { user, supabase, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { public_token } = await request.json();
  if (!public_token) {
    return NextResponse.json({ error: "Missing public_token" }, { status: 400 });
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Encrypt the access token before storing
    const encryptedToken = encrypt(access_token);

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token });
    const institutionId = itemResponse.data.item.institution_id;

    let institutionName = "Unknown Institution";
    if (institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US" as any],
        });
        institutionName = instResponse.data.institution.name;
      } catch {
        // Institution name lookup failed, use default
      }
    }

    // Store plaid item
    const { data: plaidItem, error: insertError } = await supabase
      .from("plaid_items")
      .insert({
        user_id: user.id,
        plaid_item_id: item_id,
        plaid_access_token: encryptedToken,
        plaid_institution_id: institutionId,
        institution_name: institutionName,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to store connection" }, { status: 500 });
    }

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({ access_token });

    for (const account of accountsResponse.data.accounts) {
      await supabase.from("accounts").insert({
        user_id: user.id,
        plaid_item_id: plaidItem.id,
        plaid_account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: mapAccountType(account.type),
        subtype: account.subtype,
        mask: account.mask,
        current_balance_cents: Math.round(
          (account.balances.current || 0) * 100
        ),
        available_balance_cents: account.balances.available
          ? Math.round(account.balances.available * 100)
          : null,
        credit_limit_cents: account.balances.limit
          ? Math.round(account.balances.limit * 100)
          : null,
        is_manual: false,
      });
    }

    return NextResponse.json({
      success: true,
      plaid_item_id: plaidItem.id,
      institution_name: institutionName,
      accounts_added: accountsResponse.data.accounts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to connect account" },
      { status: 500 }
    );
  }
}

function mapAccountType(plaidType: string): string {
  const map: Record<string, string> = {
    depository: "checking",
    credit: "credit",
    loan: "loan",
    investment: "investment",
  };
  return map[plaidType] || "other";
}
