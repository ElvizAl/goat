import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// Use the environment variable, with a fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-fallback-key-here"

if (!process.env.ENCRYPTION_KEY) {
  console.warn("ENCRYPTION_KEY environment variable is not set. Using fallback key for development.")
}

// Ensure the key is exactly 32 characters for AES-256
const key = ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)
const ALGORITHM = "aes-256-cbc"

// Encrypt data
export async function encrypt(text: string): Promise<string> {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(key), iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  return `${iv.toString("hex")}:${encrypted}`
}

// Decrypt data
export async function decrypt(encryptedText: string): Promise<string> {
  const [ivHex, encrypted] = encryptedText.split(":")

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted data format")
  }

  const iv = Buffer.from(ivHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(key), iv)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
