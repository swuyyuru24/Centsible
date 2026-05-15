import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(key);
}

const SYSTEM_PROMPT = `You are a transaction categorizer for a personal finance app. Given a transaction name (merchant/description), return the single best matching category from this exact list:

- Housing
- Food & Dining
- Groceries
- Transportation
- Utilities
- Entertainment
- Shopping
- Healthcare
- Insurance
- Subscriptions
- Personal Care
- Education
- Gifts & Donations
- Travel
- Income
- Transfer
- Uncategorized

Rules:
- Respond with ONLY the category name, nothing else
- Coffee shops, restaurants, fast food = "Food & Dining"
- Grocery stores, supermarkets = "Groceries"
- Uber/Lyft rides = "Transportation"
- Uber Eats/DoorDash/Grubhub = "Food & Dining"
- Netflix/Spotify/subscriptions = "Subscriptions"
- Amazon = "Shopping" (unless clearly groceries)
- Payroll/salary/direct deposit = "Income"
- Venmo/Zelle/transfers between accounts = "Transfer"
- If truly unclear, return "Uncategorized"`;

/**
 * Use Gemini Flash to categorize a transaction by its name.
 * Returns the category name string.
 * Only call server-side — never import in client components.
 */
export async function categorizeTransaction(transactionName: string): Promise<string> {
  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nTransaction: "${transactionName}"` }] },
      ],
    });

    const category = result.response.text().trim();

    // Validate it's one of our categories
    const validCategories = [
      "Housing", "Food & Dining", "Groceries", "Transportation",
      "Utilities", "Entertainment", "Shopping", "Healthcare",
      "Insurance", "Subscriptions", "Personal Care", "Education",
      "Gifts & Donations", "Travel", "Income", "Transfer", "Uncategorized",
    ];

    return validCategories.includes(category) ? category : "Uncategorized";
  } catch {
    return "Uncategorized";
  }
}

/**
 * Batch categorize multiple transactions at once (saves API calls).
 * Returns a map of transaction name → category name.
 */
export async function categorizeTransactionsBatch(
  transactionNames: string[]
): Promise<Record<string, string>> {
  if (transactionNames.length === 0) return {};

  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${SYSTEM_PROMPT}

Categorize each transaction below. Return ONLY a JSON object mapping each transaction name to its category. No explanation, no markdown, just the JSON.

Transactions:
${transactionNames.map((name, i) => `${i + 1}. "${name}"`).join("\n")}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    const validCategories = [
      "Housing", "Food & Dining", "Groceries", "Transportation",
      "Utilities", "Entertainment", "Shopping", "Healthcare",
      "Insurance", "Subscriptions", "Personal Care", "Education",
      "Gifts & Donations", "Travel", "Income", "Transfer", "Uncategorized",
    ];

    const result_map: Record<string, string> = {};
    for (const name of transactionNames) {
      const cat = parsed[name];
      result_map[name] = validCategories.includes(cat) ? cat : "Uncategorized";
    }
    return result_map;
  } catch {
    // Fallback: everything uncategorized
    const result_map: Record<string, string> = {};
    for (const name of transactionNames) {
      result_map[name] = "Uncategorized";
    }
    return result_map;
  }
}
