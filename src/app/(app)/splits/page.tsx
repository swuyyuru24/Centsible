"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SplitsPage() {
  const isConnected = false; // Will check for Splitwise token

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Split Expenses</h1>
        {!isConnected && (
          <Button render={<Link href="/api/splitwise/authorize" />}>
            <Users className="mr-2 h-4 w-4" />
            Connect Splitwise
          </Button>
        )}
      </div>

      {!isConnected ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Connect Splitwise</p>
              <p className="text-muted-foreground mt-1">
                Link your Splitwise account to see shared expenses, balances,
                and split transactions directly from Centsible.
              </p>
            </div>
            <Button render={<Link href="/api/splitwise/authorize" />}>
              Connect Splitwise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Splitwise Connected</CardTitle>
              <CardDescription>
                Your groups, balances, and expenses are synced.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Groups and balances will appear here once connected.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How &quot;Split This&quot; works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. A transaction comes in from your bank (via Plaid)</p>
          <p>2. Tap &quot;Split This&quot; on any transaction</p>
          <p>3. Pick a Splitwise group and split method</p>
          <p>4. Centsible creates the expense in Splitwise — your friends see it instantly</p>
          <p>5. Your budget shows only YOUR share, not the full amount</p>
        </CardContent>
      </Card>
    </div>
  );
}
