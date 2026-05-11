"use client";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <div className="bg-primary/10 text-primary text-center text-sm py-1.5 px-4 border-b border-primary/20">
      Demo Mode — all data is simulated. No real bank accounts are connected.
    </div>
  );
}
