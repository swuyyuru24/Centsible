import { z } from "zod";

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit",
  "investment",
  "loan",
  "other",
] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(ACCOUNT_TYPES),
  current_balance_cents: z.number().int(),
  credit_limit_cents: z.number().int().nullable().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
