"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#6366f1", "#f59e0b", "#84cc16", "#06b6d4", "#ec4899",
  "#f97316", "#8b5cf6", "#ef4444", "#14b8a6", "#3b82f6",
];

export default function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, name, type, current_balance_cents")
        .eq("is_hidden", false);
      return data || [];
    },
  });

  const { data: thisMonthTx = [] } = useQuery({
    queryKey: ["transactions-this-month"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount_cents, category_id, categories(name, icon, color)")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .eq("excluded", false);
      return data || [];
    },
  });

  const { data: lastMonthTx = [] } = useQuery({
    queryKey: ["transactions-last-month"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount_cents")
        .gte("date", lastMonthStart)
        .lte("date", lastMonthEnd)
        .eq("excluded", false)
        .gt("amount_cents", 0);
      return data || [];
    },
  });

  const { data: recentTx = [] } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, name, amount_cents, date, categories(name, icon)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("is_active", true)
        .eq("goal_type", "limit");
      return data || [];
    },
  });

  // Calculate totals
  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.current_balance_cents || 0),
    0
  );
  const assets = accounts
    .filter((a) => a.type !== "credit" && a.type !== "loan")
    .reduce((sum, a) => sum + (a.current_balance_cents || 0), 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit" || a.type === "loan")
    .reduce((sum, a) => sum + Math.abs(a.current_balance_cents || 0), 0);

  const thisMonthSpending = thisMonthTx
    .filter((tx: any) => tx.amount_cents > 0)
    .reduce((sum: number, tx: any) => sum + tx.amount_cents, 0);
  const thisMonthIncome = thisMonthTx
    .filter((tx: any) => tx.amount_cents < 0)
    .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount_cents), 0);
  const lastMonthSpending = lastMonthTx.reduce(
    (sum: number, tx: any) => sum + tx.amount_cents,
    0
  );

  const spendingDiff = lastMonthSpending > 0
    ? ((thisMonthSpending - lastMonthSpending) / lastMonthSpending) * 100
    : 0;

  // Spending by category for chart
  const categoryMap: Record<string, { name: string; amount: number; color: string }> = {};
  for (const tx of thisMonthTx as any[]) {
    if (tx.amount_cents > 0 && tx.categories) {
      const cats = Array.isArray(tx.categories) ? tx.categories : [tx.categories];
      const cat = cats[0];
      if (cat) {
        const key = cat.name;
        if (!categoryMap[key]) {
          categoryMap[key] = { name: key, amount: 0, color: cat.color || "#6366f1" };
        }
        categoryMap[key].amount += tx.amount_cents;
      }
    }
  }
  const chartData = Object.values(categoryMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((d) => ({ ...d, amount: d.amount / 100 }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Worth
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(assets - liabilities)}
            </p>
            <p className="text-xs text-muted-foreground">
              {accounts.length} accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spending This Month
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(thisMonthSpending)}
            </p>
            {lastMonthSpending > 0 && (
              <p
                className={cn(
                  "text-xs",
                  spendingDiff > 0 ? "text-red-600" : "text-green-600"
                )}
              >
                {spendingDiff > 0 ? "+" : ""}
                {spendingDiff.toFixed(0)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(thisMonthIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saved This Month
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                thisMonthIncome - thisMonthSpending >= 0
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {formatCurrency(thisMonthIncome - thisMonthSpending)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by category chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Spent"]}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No spending data this month
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link
              href="/transactions"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {(recentTx as any[]).map((tx) => {
                  const cat = Array.isArray(tx.categories)
                    ? tx.categories[0]
                    : tx.categories;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {tx.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.date + "T00:00:00"), "MMM d")}{" "}
                          {cat && `· ${cat.icon} ${cat.name}`}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "ml-4 text-sm font-medium",
                          tx.amount_cents < 0
                            ? "text-green-600"
                            : "text-foreground"
                        )}
                      >
                        {tx.amount_cents < 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(tx.amount_cents))}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal health */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Goal Health</CardTitle>
            <Link
              href="/budgets"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(goals as any[]).slice(0, 6).map((goal) => {
                const spent = 0; // Will be calculated with real category spending
                const pct =
                  goal.amount_cents > 0
                    ? Math.min((spent / goal.amount_cents) * 100, 100)
                    : 0;
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{goal.name}</span>
                      <span className="text-muted-foreground">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct > 90
                            ? "bg-red-500"
                            : pct > 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
