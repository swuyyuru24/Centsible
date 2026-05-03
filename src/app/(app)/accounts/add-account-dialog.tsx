"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { dollarsToCents } from "@/lib/utils";
import { accountSchema, ACCOUNT_TYPES, type AccountFormValues } from "@/lib/validators/account";
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
import { Plus } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  investment: "Investment",
  loan: "Loan",
  other: "Other",
};

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      current_balance_cents: 0,
      credit_limit_cents: null,
    },
  });

  async function onSubmit(values: AccountFormValues) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: values.name,
      type: values.type,
      current_balance_cents: values.current_balance_cents,
      credit_limit_cents: values.credit_limit_cents,
      is_manual: true,
    });

    if (error) {
      // Don't log Supabase errors to console in production — they can reveal schema details
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    form.reset();
    setOpen(false);
    setSaving(false);
  }

  const watchType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Account
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g. Chase Checking"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(val) => val && form.setValue("type", val as typeof ACCOUNT_TYPES[number])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance ($)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              onChange={(e) =>
                form.setValue(
                  "current_balance_cents",
                  dollarsToCents(parseFloat(e.target.value) || 0)
                )
              }
            />
          </div>

          {watchType === "credit" && (
            <div className="space-y-2">
              <Label htmlFor="limit">Credit Limit ($)</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                onChange={(e) =>
                  form.setValue(
                    "credit_limit_cents",
                    dollarsToCents(parseFloat(e.target.value) || 0)
                  )
                }
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding..." : "Add Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
