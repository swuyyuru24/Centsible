"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, TrendingUp, Wallet, PiggyBank, CircleDot, Trash2, RefreshCw } from "lucide-react";
import { AddAccountDialog } from "./add-account-dialog";
import { ConnectBankButton } from "./connect-bank-button";

const ACCOUNT_TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  checking: { label: "Checking", icon: Landmark },
  savings: { label: "Savings", icon: PiggyBank },
  credit: { label: "Credit Card", icon: CreditCard },
  investment: { label: "Investment", icon: TrendingUp },
  loan: { label: "Loan", icon: Wallet },
  other: { label: "Other", icon: CircleDot },
};

type Account = {
  id: string;
  name: string;
  type: string;
  current_balance_cents: number;
  credit_limit_cents: number | null;
  is_manual: boolean;
  mask: string | null;
};

export default function AccountsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    const { data: plaidItems } = await supabase
      .from("plaid_items")
      .select("id")
      .eq("status", "active");

    for (const item of plaidItems || []) {
      await fetch("/api/plaid/sync-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plaid_item_id: item.id }),
      });
    }

    await fetch("/api/plaid/balances", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setSyncing(false);
  }

  async function handleDelete(accountId: string) {
    if (!confirm("Delete this account and all its transactions?")) return;
    await supabase.from("transactions").delete().eq("account_id", accountId);
    await supabase.from("accounts").delete().eq("id", accountId);
    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, type, current_balance_cents, credit_limit_cents, is_manual, mask")
        .eq("is_hidden", false)
        .order("type")
        .order("name");
      if (error) throw error;
      return data as Account[];
    },
  });

  const grouped = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    const group = account.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(account);
    return acc;
  }, {});

  const totalAssets = accounts
    .filter((a) => a.type !== "credit" && a.type !== "loan")
    .reduce((sum, a) => sum + (a.current_balance_cents || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === "credit" || a.type === "loan")
    .reduce((sum, a) => sum + Math.abs(a.current_balance_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
          <ConnectBankButton />
          <AddAccountDialog />
        </div>
      </div>

      {!isLoading && accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalLiabilities)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(totalAssets - totalLiabilities)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No accounts yet. Add your first account to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, accs]) => {
          const meta = ACCOUNT_TYPE_META[type] || ACCOUNT_TYPE_META.other;
          const Icon = meta.icon;
          return (
            <div key={type} className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Icon className="h-5 w-5 text-muted-foreground" />
                {meta.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accs.map((account) => (
                  <Card key={account.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        {account.mask && (
                          <p className="text-sm text-muted-foreground">
                            ****{account.mask}
                          </p>
                        )}
                        {account.is_manual && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p
                          className={`text-lg font-semibold ${
                            account.current_balance_cents < 0
                              ? "text-red-600"
                              : "text-foreground"
                          }`}
                        >
                          {formatCurrency(account.current_balance_cents)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(account.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
