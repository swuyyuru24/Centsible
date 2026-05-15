/**
 * Validates that all required environment variables are set.
 * Call this at app startup to fail fast instead of crashing at runtime.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PLAID_CLIENT_ID",
  "PLAID_SECRET",
  "TOKEN_ENCRYPTION_KEY",
] as const;

const optional = [
  "PLAID_ENV",
  "GEMINI_API_KEY",
  "SPLITWISE_CONSUMER_KEY",
  "SPLITWISE_CONSUMER_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_DEMO_MODE",
] as const;

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nSee .env.example for details.`
    );
  }

  // Validate TOKEN_ENCRYPTION_KEY is a 64-char hex string (32 bytes for AES-256)
  const encKey = process.env.TOKEN_ENCRYPTION_KEY!;
  if (!/^[0-9a-fA-F]{64}$/.test(encKey)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).\nGenerate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  // Warn about missing optional vars in development
  if (process.env.NODE_ENV === "development") {
    const missingOptional = optional.filter((key) => !process.env[key]);
    if (missingOptional.length > 0) {
      console.warn(
        `Optional environment variables not set: ${missingOptional.join(", ")}`
      );
    }
  }
}
