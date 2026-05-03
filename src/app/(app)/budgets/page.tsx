"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, differenceInMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, TrendingDown } from "lucide-react";
import { AddGoalDialog } from "./add-goal-dialog";
import { EditGoalDialog } from "./edit-goal-dialog";

type Goal = {
  id: string;
  name: string;
  goal_type: string;
  category_id: string | null;
  amount_cents: number;
  period: string;
  target_amount_cents: number | null;
  current_saved_cents: number;
  deadline: string | null;
  account_id: string | null;
  is_active: boolean;
};

function getPeriodRange(period: string) {
  const now = new Date();
  if (period === "weekly") return { start: startOfWeek(now), end: endOfWeek(now) };
  if (period === "yearly") return { start: startOfYear(now), end: endOfYear(now) };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

function GoalCard({
  goal,
  spent,
}: {
  goal: Goal;
  spent: number;
}) {
  const isLimit = goal.goal_type === "limit";
  const limit = goal.amount_cents;

  if (isLimit) {
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const over = spent > limit;
    const warning = pct >= 80 && !over;
    const remaining = limit - spent;

    return (
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{goal.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
              variant={over ? "destructive" : warning ? "secondary" : "default"}
              className={cn(
                !over && !warning && "bg-green-100 text-green-800"
              )}
            >
              {over ? "Over" : warning ? `${Math.round(pct)}%` : "On track"}
            </Badge>
              <EditGoalDialog goal={goal} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(spent)} of {formatCurrency(limit)}
              </span>
              <span
                className={cn(
                  "font-medium",
                  over ? "text-red-600" : "text-green-600"
                )}
              >
                {over
                  ? `${formatCurrency(Math.abs(remaining))} over`
                  : `${formatCurrency(remaining)} left`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  over
                    ? "bg-red-500"
                    : warning
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground capitalize">{goal.period}</p>
        </CardContent>
      </Card>
    );
  }

  // Target goal
  const target = goal.target_amount_cents || 0;
  const saved = goal.current_saved_cents;
  const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const remaining = target - saved;

  let paceNote: string | null = null;
  if (goal.deadline) {
    const monthsLeft = Math.max(differenceInMonths(new Date(goal.deadline), new Date()), 1);
    const neededPerMonth = remaining / monthsLeft;
    if (remaining > 0) {
      paceNote = `Need ${formatCurrency(Math.round(neededPerMonth))}/month to hit deadline`;
    }
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{goal.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                pct >= 100
                  ? "bg-green-100 text-green-800"
                  : pct >= 50
                  ? "bg-blue-100 text-blue-800"
                  : ""
              )}
              variant={pct < 50 ? "secondary" : "default"}
            >
              {Math.round(pct)}%
            </Badge>
            <EditGoalDialog goal={goal} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(saved)} of {formatCurrency(target)}
            </span>
            <span className="font-medium">
              {remaining > 0
                ? `${formatCurrency(remaining)} to go`
                : "Reached!"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {goal.deadline && (
          <p className="text-xs text-muted-foreground">
            Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}
          </p>
        )}
        {paceNote && (
          <p className="text-xs text-muted-foreground">{paceNote}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const supabase = createClient();

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("is_active", true)
        .order("goal_type")
        .order("name");
      if (error) throw error;
      return data as Goal[];
    },
  });

  const { data: spendingByCategory = {} } = useQuery({
    queryKey: ["spending-by-category"],
    queryFn: async () => {
      const { start, end } = getPeriodRange("monthly");
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id, amount_cents")
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .gt("amount_cents", 0)
        .eq("excluded", false);
      if (error) throw error;

      const map: Record<string, number> = {};
      for (const tx of data || []) {
        if (tx.category_id) {
          map[tx.category_id] = (map[tx.category_id] || 0) + tx.amount_cents;
        }
      }
      return map;
    },
  });

  const limits = goals.filter((g) => g.goal_type === "limit");
  const targets = goals.filter((g) => g.goal_type === "target");

  const onTrack = limits.filter((g) => {
    const spent = g.category_id ? spendingByCategory[g.category_id] || 0 : 0;
    return spent <= g.amount_cents;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <AddGoalDialog />
      </div>

      {!goalsLoading && goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Spending Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {onTrack}/{limits.length}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  on track
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saving Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{targets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{goals.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {goalsLoading ? (
        <p className="text-muted-foreground">Loading goals...</p>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No goals yet. Set your first spending limit or saving target!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({goals.length})</TabsTrigger>
            <TabsTrigger value="limits">
              Limits ({limits.length})
            </TabsTrigger>
            <TabsTrigger value="targets">
              Targets ({targets.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  spent={
                    goal.category_id
                      ? spendingByCategory[goal.category_id] || 0
                      : 0
                  }
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="limits" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {limits.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  spent={
                    goal.category_id
                      ? spendingByCategory[goal.category_id] || 0
                      : 0
                  }
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="targets" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {targets.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  spent={0}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
