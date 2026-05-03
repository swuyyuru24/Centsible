// Map Plaid's personal_finance_category to our system categories
const PLAID_CATEGORY_MAP: Record<string, string> = {
  "INCOME": "Income",
  "TRANSFER_IN": "Transfer",
  "TRANSFER_OUT": "Transfer",
  "LOAN_PAYMENTS": "Housing",
  "RENT": "Housing",
  "FOOD_AND_DRINK": "Food & Dining",
  "FOOD_AND_DRINK.RESTAURANTS": "Food & Dining",
  "FOOD_AND_DRINK.COFFEE": "Food & Dining",
  "FOOD_AND_DRINK.FAST_FOOD": "Food & Dining",
  "FOOD_AND_DRINK.GROCERIES": "Groceries",
  "GENERAL_MERCHANDISE": "Shopping",
  "GENERAL_MERCHANDISE.ONLINE_MARKETPLACES": "Shopping",
  "GENERAL_MERCHANDISE.CLOTHING_AND_ACCESSORIES": "Shopping",
  "GENERAL_MERCHANDISE.ELECTRONICS": "Shopping",
  "TRANSPORTATION": "Transportation",
  "TRANSPORTATION.GAS": "Transportation",
  "TRANSPORTATION.PARKING": "Transportation",
  "TRANSPORTATION.PUBLIC_TRANSIT": "Transportation",
  "TRANSPORTATION.TAXIS_AND_RIDE_SHARES": "Transportation",
  "TRAVEL": "Travel",
  "TRAVEL.FLIGHTS": "Travel",
  "TRAVEL.LODGING": "Travel",
  "ENTERTAINMENT": "Entertainment",
  "ENTERTAINMENT.MUSIC_AND_AUDIO": "Subscriptions",
  "ENTERTAINMENT.TV_AND_MOVIES": "Subscriptions",
  "PERSONAL_CARE": "Personal Care",
  "MEDICAL": "Healthcare",
  "MEDICAL.PHARMACIES_AND_SUPPLEMENTS": "Healthcare",
  "GOVERNMENT_AND_NON_PROFIT.DONATIONS": "Gifts & Donations",
  "HOME_IMPROVEMENT": "Housing",
  "UTILITIES": "Utilities",
  "EDUCATION": "Education",
};

/**
 * Map a Plaid personal_finance_category to our category name.
 * Tries detailed first (e.g., "FOOD_AND_DRINK.GROCERIES"), then primary (e.g., "FOOD_AND_DRINK").
 */
export function mapPlaidCategory(
  primary: string,
  detailed?: string
): string {
  if (detailed && PLAID_CATEGORY_MAP[`${primary}.${detailed}`]) {
    return PLAID_CATEGORY_MAP[`${primary}.${detailed}`];
  }
  if (PLAID_CATEGORY_MAP[primary]) {
    return PLAID_CATEGORY_MAP[primary];
  }
  return "Uncategorized";
}
