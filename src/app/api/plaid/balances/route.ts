import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { decrypt } from "@/lib/crypto";

export async function POST() {
  const { user, supabase, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  // Get all plaid items for this user
  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id, plaid_access_token")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!plaidItems?.length) {
    return NextResponse.json({ updated: 0 });
  }

  let updated = 0;

  for (const item of plaidItems) {
    try {
      const accessToken = decrypt(item.plaid_access_token);
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      for (const account of response.data.accounts) {
        await supabase
          .from("accounts")
          .update({
            current_balance_cents: Math.round(
              (account.balances.current || 0) * 100
            ),
            available_balance_cents: account.balances.available
              ? Math.round(account.balances.available * 100)
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("plaid_account_id", account.account_id);
        updated++;
      }
    } catch {
      // If one item fails, continue with others
    }
  }

  return NextResponse.json({ updated });
}
