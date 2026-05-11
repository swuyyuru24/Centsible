"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { dollarsToCents, centsToDollars } from "@/lib/utils";
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
import { Pencil, Trash2, Loader2 } from "lucide-react";

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

export function EditGoalDialog({ goal }: { goal: Goal }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      return (data || []) as { id: string; name: string; icon: string }[];
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
      return (data || []) as { id: string; name: string; type: string }[];
    },
  });

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal.name,
      goal_type: goal.goal_type as "limit" | "target",
      category_id: goal.category_id,
      amount_cents: goal.amount_cents,
      period: goal.period as "monthly" | "weekly" | "yearly",
      target_amount_cents: goal.target_amount_cents,
      deadline: goal.deadline,
      account_id: goal.account_id,
    },
  });

  async function onSubmit(values: GoalFormValues) {
    setSaving(true);

    const { error } = await supabase
      .from("goals")
      .update({
        name: values.name,
        category_id: values.category_id || null,
        amount_cents: values.amount_cents,
        period: values.period,
        target_amount_cents: values.target_amount_cents || null,
        deadline: values.deadline || null,
        account_id: values.account_id || null,
      })
      .eq("id", goal.id);

    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      setOpen(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);

    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      setOpen(false);
    }
    setDeleting(false);
  }

  const [amountDisplay, setAmountDisplay] = useState(centsToDollars(goal.amount_cents).toFixed(2));
  const [targetDisplay, setTargetDisplay] = useState(
    goal.target_amount_cents ? centsToDollars(goal.target_amount_cents).toFixed(2) : ""
  );
  const [deadlineDisplay, setDeadlineDisplay] = useState(goal.deadline || "");

  const isLimit = goal.goal_type === "limit";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-goal-name">Goal Name</Label>
            <Input id="edit-goal-name" {...form.register("name")} />
          </div>

          {isLimit && (
            <div className="space-y-2">
              <Label>Category</Label>
              {categories.length > 0 ? (
                <Select
                  value={form.watch("category_id") || ""}
                  onValueChange={(val) => val && form.setValue("category_id", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category">
                      {(() => {
                        const cat = categories.find((c) => c.id === form.watch("category_id"));
                        return cat ? `${cat.icon} ${cat.name}` : "Select category";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Loading categories...</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-amount">
                {isLimit ? "Limit ($)" : "Monthly contribution ($)"}
              </Label>
              <Input
                id="edit-goal-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amountDisplay}
                onChange={(e) => {
                  setAmountDisplay(e.target.value);
                  form.setValue("amount_cents", dollarsToCents(parseFloat(e.target.value) || 0));
                }}
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

          {!isLimit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-target">Total Target ($)</Label>
                <Input
                  id="edit-goal-target"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetDisplay}
                  onChange={(e) => {
                    setTargetDisplay(e.target.value);
                    form.setValue("target_amount_cents", dollarsToCents(parseFloat(e.target.value) || 0));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-deadline">Deadline (optional)</Label>
                <Input
                  id="edit-goal-deadline"
                  type="date"
                  value={deadlineDisplay}
                  onChange={(e) => {
                    setDeadlineDisplay(e.target.value);
                    form.setValue("deadline", e.target.value || null);
                  }}
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
