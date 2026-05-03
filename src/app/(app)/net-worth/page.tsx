"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#84cc16", "#f59e0b", "#ec4899", "#8b5cf6"];

type Account = {
  id: string;
  name: string;
  type: string;
  current_balance_cents: number;
};

export default function NetWorthPage() {
  const supabase = createClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, name, type, current_balance_cents")
        .eq("is_hidden", false)
        .order("type")
        .order("name");
      return (data || []) as Account[];
    },
  });

  // Monthly income vs expenses for last 6 months
  const { data: monthlyData = [] } = useQuery({
    queryKey: ["monthly-income-expenses"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = format(startOfMonth(d), "yyyy-MM-dd");
        const end = format(endOfMonth(d), "yyyy-MM-dd");
        months.push({ month: format(d, "MMM"), start, end });
      }

      const results = [];
      for (const m of months) {
        const { data } = await supabase
          .from("transactions")
          .select("amount_cents")
          .gte("date", m.start)
          .lte("date", m.end)
          .eq("excluded", false);

        const income = (data || [])
          .filter((tx) => tx.amount_cents < 0)
          .reduce((sum, tx) => sum + Math.abs(tx.amount_cents), 0);
        const expenses = (data || [])
          .filter((tx) => tx.amount_cents > 0)
          .reduce((sum, tx) => sum + tx.amount_cents, 0);

        results.push({
          month: m.month,
          income: income / 100,
          expenses: expenses / 100,
          net: (income - expenses) / 100,
        });
      }
      return results;
    },
  });

  const assets = accounts
    .filter((a) => a.type !== "credit" && a.type !== "loan")
    .reduce((sum, a) => sum + (a.current_balance_cents || 0), 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit" || a.type === "loan")
    .reduce((sum, a) => sum + Math.abs(a.current_balance_cents || 0), 0);
  const netWorth = assets - liabilities;

  // Pie chart data for asset allocation
  const assetAccounts = accounts
    .filter((a) => a.type !== "credit" && a.type !== "loan" && a.current_balance_cents > 0)
    .map((a) => ({
      name: a.name,
      value: a.current_balance_cents / 100,
    }));

  const TYPE_LABELS: Record<string, string> = {
    checking: "Checking",
    savings: "Savings",
    credit: "Credit Card",
    investment: "Investment",
    loan: "Loan",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Net Worth</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(assets)}
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
              {formatCurrency(liabilities)}
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
            <p
              className={cn(
                "text-2xl font-bold",
                netWorth >= 0 ? "text-foreground" : "text-red-600"
              )}
            >
              {formatCurrency(netWorth)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {assetAccounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={assetAccounts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {assetAccounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No assets to display
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Savings Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Savings</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Savings"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Account Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[account.type] || account.type}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-medium",
                    account.current_balance_cents < 0
                      ? "text-red-600"
                      : "text-foreground"
                  )}
                >
                  {formatCurrency(account.current_balance_cents)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
