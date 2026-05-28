import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
// Ciphertext format: version(1) + iv(12) + authTag(16) + ciphertext
// Version byte allows key rotation without breaking stored tokens.
const VERSION = 0x01;

export function getEncryptionKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // version(1) + iv(12) + authTag(16) + ciphertext
  const out = Buffer.alloc(1 + IV_LENGTH + AUTH_TAG_LENGTH + encrypted.length);
  out[0] = VERSION;
  iv.copy(out, 1);
  authTag.copy(out, 1 + IV_LENGTH);
  encrypted.copy(out, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
  return out.toString("hex");
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "hex");
  const version = data[0];
  if (version !== VERSION) {
    throw new Error(`Unsupported token ciphertext version: ${version}`);
  }
  const iv = data.subarray(1, 1 + IV_LENGTH);
  const authTag = data.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

export function hmacSign(message: string): string {
  const key = getEncryptionKey();
  return createHmac("sha256", key).update(message).digest("hex");
}
