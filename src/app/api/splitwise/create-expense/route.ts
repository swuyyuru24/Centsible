import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export async function POST(request: Request) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const token = request.headers.get("x-splitwise-token");
  if (!token) {
    return NextResponse.json({ error: "No Splitwise token" }, { status: 401 });
  }

  const body = await request.json();
  const { description, cost, group_id, split_equally, currency_code } = body;

  try {
    const response = await fetch(
      "https://secure.splitwise.com/api/v3.0/create_expense",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          cost: (cost / 100).toFixed(2), // Convert cents to dollars
          group_id,
          split_equally,
          currency_code: currency_code || "USD",
        }),
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
