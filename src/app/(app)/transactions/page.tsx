"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTransactionDialog } from "./add-transaction-dialog";

type TransactionRow = {
  id: string;
  amount_cents: number;
  date: string;
  name: string;
  pending: boolean;
  is_manual: boolean;
  accounts: { name: string }[] | null;
  categories: { name: string; icon: string }[] | null;
};

type Transaction = {
  id: string;
  amount_cents: number;
  date: string;
  name: string;
  pending: boolean;
  is_manual: boolean;
  account_name: string | null;
  category_name: string | null;
  category_icon: string | null;
};

export default function TransactionsPage() {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, amount_cents, date, name, pending, is_manual, accounts(name), categories(name, icon)"
        )
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as TransactionRow[]).map((row) => ({
        id: row.id,
        amount_cents: row.amount_cents,
        date: row.date,
        name: row.name,
        pending: row.pending,
        is_manual: row.is_manual,
        account_name: row.accounts?.[0]?.name ?? null,
        category_name: row.categories?.[0]?.name ?? null,
        category_icon: row.categories?.[0]?.icon ?? null,
      }));
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, name")
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

  const filtered = transactions.filter((tx) => {
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (accountFilter !== "all" && tx.account_name !== accountFilter) {
      return false;
    }
    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorized" && tx.category_name) return false;
      if (categoryFilter !== "uncategorized" && tx.category_name !== categoryFilter)
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <AddTransactionDialog />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={accountFilter} onValueChange={(val) => val && setAccountFilter(val)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.name}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading transactions...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {transactions.length === 0
                ? "No transactions yet. Add your first transaction!"
                : "No transactions match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.date + "T00:00:00"), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{tx.name}</span>
                      {tx.pending && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.category_name ? (
                        <span>
                          {tx.category_icon} {tx.category_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.account_name || "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        tx.amount_cents < 0 ? "text-green-600" : "text-foreground"
                      )}
                    >
                      {tx.amount_cents < 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount_cents))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-2 md:hidden">
            {filtered.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(tx.date + "T00:00:00"), "MMM d")}
                      </span>
                      {tx.category_name && (
                        <>
                          <span>·</span>
                          <span>
                            {tx.category_icon} {tx.category_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "ml-4 font-semibold",
                      tx.amount_cents < 0 ? "text-green-600" : "text-foreground"
                    )}
                  >
                    {tx.amount_cents < 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(tx.amount_cents))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
