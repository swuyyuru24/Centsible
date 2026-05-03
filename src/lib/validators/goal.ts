import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  goal_type: z.enum(["limit", "target"]),
  category_id: z.string().uuid().nullable().optional(),
  amount_cents: z.number().int().positive("Amount must be greater than 0"),
  period: z.enum(["monthly", "weekly", "yearly"]),
  target_amount_cents: z.number().int().positive().nullable().optional(),
  deadline: z.string().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
