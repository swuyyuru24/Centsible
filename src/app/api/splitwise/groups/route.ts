import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export async function GET(request: Request) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const token = request.headers.get("x-splitwise-token");
  if (!token) {
    return NextResponse.json({ error: "No Splitwise token" }, { status: 401 });
  }

  try {
    const response = await fetch("https://secure.splitwise.com/api/v3.0/get_groups", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}
