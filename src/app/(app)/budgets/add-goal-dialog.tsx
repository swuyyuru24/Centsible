"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { dollarsToCents } from "@/lib/utils";
import { goalSchema, type GoalFormValues } from "@/lib/validators/goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export function AddGoalDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      return data || [];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, name, type")
        .eq("is_hidden", false)
        .order("name");
      return data || [];
    },
  });

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      goal_type: "limit",
      category_id: null,
      amount_cents: 0,
      period: "monthly",
      target_amount_cents: null,
      deadline: null,
      account_id: null,
    },
  });

  const goalType = form.watch("goal_type");

  async function onSubmit(values: GoalFormValues) {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      name: values.name,
      goal_type: values.goal_type,
      category_id: values.category_id || null,
      amount_cents: values.amount_cents,
      period: values.period,
      target_amount_cents: values.target_amount_cents || null,
      deadline: values.deadline || null,
      account_id: values.account_id || null,
    });

    if (error) {
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["goals"] });
    form.reset();
    setOpen(false);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Goal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={goalType}
            onValueChange={(val) =>
              val && form.setValue("goal_type", val as "limit" | "target")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="limit" className="flex-1">
                Spending Limit
              </TabsTrigger>
              <TabsTrigger value="target" className="flex-1">
                Saving Target
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder={
                goalType === "limit"
                  ? "e.g. Food & Dining budget"
                  : "e.g. Emergency Fund"
              }
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {goalType === "limit" && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch("category_id") || ""}
                onValueChange={(val) => val && form.setValue("category_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-amount">
                {goalType === "limit" ? "Limit ($)" : "Monthly contribution ($)"}
              </Label>
              <Input
                id="goal-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                onChange={(e) =>
                  form.setValue(
                    "amount_cents",
                    dollarsToCents(parseFloat(e.target.value) || 0)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={form.watch("period")}
                onValueChange={(val) =>
                  val && form.setValue("period", val as "monthly" | "weekly" | "yearly")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {goalType === "target" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Total Target ($)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 10000"
                  onChange={(e) =>
                    form.setValue(
                      "target_amount_cents",
                      dollarsToCents(parseFloat(e.target.value) || 0)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Deadline (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  onChange={(e) => form.setValue("deadline", e.target.value || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Linked Account (optional)</Label>
                <Select
                  value={form.watch("account_id") || ""}
                  onValueChange={(val) => val && form.setValue("account_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding..." : "Add Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
