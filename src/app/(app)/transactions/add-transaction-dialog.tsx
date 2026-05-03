"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { dollarsToCents } from "@/lib/utils";
import { transactionSchema, type TransactionFormValues } from "@/lib/validators/transaction";
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

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

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

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id: "",
      category_id: null,
      amount: 0,
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      name: "",
      notes: "",
    },
  });

  async function onSubmit(values: TransactionFormValues) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amountCents = dollarsToCents(values.amount);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: values.account_id,
      category_id: values.category_id || null,
      amount_cents: values.type === "expense" ? amountCents : -amountCents,
      date: values.date,
      name: values.name,
      notes: values.notes || null,
      is_manual: true,
    });

    if (error) {
      // Don't log Supabase errors to console in production — they can reveal schema details
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    form.reset({
      account_id: "",
      category_id: null,
      amount: 0,
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      name: "",
      notes: "",
    });
    setOpen(false);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Transaction
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={form.watch("type")}
            onValueChange={(val) => form.setValue("type", val as "expense" | "income")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="tx-name">Description</Label>
            <Input
              id="tx-name"
              placeholder="e.g. Coffee at Starbucks"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount ($)</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                onChange={(e) =>
                  form.setValue("amount", parseFloat(e.target.value) || 0)
                }
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                {...form.register("date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={form.watch("account_id")}
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
            {form.formState.errors.account_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.account_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("category_id") || ""}
              onValueChange={(val) => form.setValue("category_id", val ?? null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
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

          <div className="space-y-2">
            <Label htmlFor="tx-notes">Notes (optional)</Label>
            <Input
              id="tx-notes"
              placeholder="Any additional details"
              {...form.register("notes")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
