import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { validateOrigin } from "@/lib/csrf";
import { decrypt } from "@/lib/crypto";
import { mapPlaidCategory } from "@/lib/plaid/categories";
import { categorizeTransactionsBatch } from "@/lib/ai/categorize";

export async function POST(request: Request) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const { user, supabase, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { plaid_item_id } = await request.json();

  // Get the plaid item
  const { data: plaidItem } = await supabase
    .from("plaid_items")
    .select("id, plaid_access_token, transaction_cursor")
    .eq("id", plaid_item_id)
    .eq("user_id", user.id)
    .single();

  if (!plaidItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const accessToken = decrypt(plaidItem.plaid_access_token);

  // Get category map (name → id)
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name");
  const categoryMap: Record<string, string> = {};
  for (const cat of categories || []) {
    categoryMap[cat.name] = cat.id;
  }

  // Get user's category rules
  const { data: rules } = await supabase
    .from("category_rules")
    .select("category_id, match_field, match_pattern, priority")
    .eq("user_id", user.id)
    .order("priority", { ascending: false });

  let cursor = plaidItem.transaction_cursor || undefined;
  let added = 0;
  let modified = 0;
  let removed = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      });

      const data = response.data;

      // Process added transactions — first pass: rules + Plaid categories
      const needsAI: { tx: typeof data.added[0]; index: number }[] = [];
      const txToInsert: any[] = [];

      for (const tx of data.added) {
        const ruleCategory = applyCategoryRules(tx.name, tx.merchant_name, rules);
        const plaidCategory = mapPlaidCategory(
          tx.personal_finance_category?.primary || "",
          tx.personal_finance_category?.detailed || ""
        );

        const categoryName = ruleCategory || (plaidCategory !== "Uncategorized" ? plaidCategory : null);

        const record = {
          user_id: user.id,
          account_id: await getAccountId(supabase, tx.account_id),
          plaid_transaction_id: tx.transaction_id,
          amount_cents: Math.round(tx.amount * 100),
          date: tx.date,
          name: tx.name,
          merchant_name: tx.merchant_name,
          pending: tx.pending,
          category_id: categoryName ? (categoryMap[categoryName] || categoryMap["Uncategorized"] || null) : null,
          is_manual: false,
        };

        txToInsert.push(record);
        if (!categoryName) {
          needsAI.push({ tx, index: txToInsert.length - 1 });
        }
      }

      // Second pass: batch AI categorization for uncategorized transactions
      if (needsAI.length > 0 && process.env.GEMINI_API_KEY) {
        const names = needsAI.map((item) => item.tx.merchant_name || item.tx.name);
        const aiCategories = await categorizeTransactionsBatch(names);

        for (let i = 0; i < needsAI.length; i++) {
          const name = names[i];
          const aiCategory = aiCategories[name];
          if (aiCategory && categoryMap[aiCategory]) {
            txToInsert[needsAI[i].index].category_id = categoryMap[aiCategory];
          } else {
            txToInsert[needsAI[i].index].category_id = categoryMap["Uncategorized"] || null;
          }
        }
      } else {
        // No AI key — mark remaining as Uncategorized
        for (const item of needsAI) {
          txToInsert[item.index].category_id = categoryMap["Uncategorized"] || null;
        }
      }

      // Batch insert all transactions
      if (txToInsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("transactions")
          .upsert(txToInsert, { onConflict: "plaid_transaction_id" });
        if (upsertError) throw upsertError;
        added += txToInsert.length;
      }

      // Batch update modified transactions
      if (data.modified.length > 0) {
        const modifiedRecords = data.modified.map((tx) => ({
          plaid_transaction_id: tx.transaction_id,
          amount_cents: Math.round(tx.amount * 100),
          date: tx.date,
          name: tx.name,
          merchant_name: tx.merchant_name,
          pending: tx.pending,
        }));
        const { error: modifyError } = await supabase
          .from("transactions")
          .upsert(modifiedRecords, { onConflict: "plaid_transaction_id" });
        if (modifyError) throw modifyError;
        modified += data.modified.length;
      }

      // Batch delete removed transactions
      if (data.removed.length > 0) {
        const removedIds = data.removed.map((tx) => tx.transaction_id);
        const { error: deleteError } = await supabase
          .from("transactions")
          .delete()
          .in("plaid_transaction_id", removedIds);
        if (deleteError) throw deleteError;
        removed += data.removed.length;
      }

      cursor = data.next_cursor;
      hasMore = data.has_more;
    }

    // Update cursor
    await supabase
      .from("plaid_items")
      .update({
        transaction_cursor: cursor,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", plaidItem.id);

    return NextResponse.json({ added, modified, removed });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}

async function getAccountId(
  supabase: any,
  plaidAccountId: string
): Promise<string> {
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("plaid_account_id", plaidAccountId)
    .single();
  return data?.id;
}

function applyCategoryRules(
  name: string,
  merchantName: string | null | undefined,
  rules: any[] | null
): string | null {
  if (!rules) return null;

  for (const rule of rules) {
    const field = rule.match_field === "merchant_name" ? merchantName : name;
    if (field && field.toLowerCase().includes(rule.match_pattern.toLowerCase())) {
      return rule.category_id;
    }
  }
  return null;
}
