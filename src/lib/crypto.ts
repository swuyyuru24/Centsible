import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string (e.g., a Plaid access token).
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 * Only use server-side — never import this in client components.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 * Only use server-side — never import this in client components.
 */
export function decrypt(encryptedString: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertext] = encryptedString.split(":");

  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error("Invalid encrypted string format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
