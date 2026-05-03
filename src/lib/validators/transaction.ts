import { z } from "zod";

export const transactionSchema = z.object({
  account_id: z.string().uuid("Select an account"),
  category_id: z.string().uuid("Select a category").nullable().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
