"use client";

import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Landmark, Loader2 } from "lucide-react";

export function ConnectBankButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const createLinkToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      }
    } catch {
      // Failed to create link token
    }
    setLoading(false);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      setLoading(true);
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const data = await res.json();
        if (data.success) {
          // Sync transactions immediately after connecting
          await fetch("/api/plaid/sync-transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plaid_item_id: data.plaid_item_id }),
          });

          await queryClient.invalidateQueries({ queryKey: ["accounts"] });
          await queryClient.invalidateQueries({ queryKey: ["transactions"] });
          await queryClient.invalidateQueries({ queryKey: ["transactions-this-month"] });
          await queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
        }
      } catch {
        // Exchange failed
      }
      setLinkToken(null);
      setLoading(false);
    },
    onExit: () => {
      setLinkToken(null);
    },
  });

  // Auto-open Plaid Link when token is ready
  if (linkToken && ready) {
    open();
  }

  return (
    <Button
      variant="outline"
      onClick={createLinkToken}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Landmark className="mr-2 h-4 w-4" />
      )}
      Link Account
    </Button>
  );
}
