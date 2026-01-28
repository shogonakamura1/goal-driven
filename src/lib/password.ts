import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const keyLen = 64;

  const derivedKey = (await scrypt(password, salt, keyLen)) as Buffer;

  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt") return false;

  const salt = Buffer.from(saltHex, "hex");
  const keyLen = Buffer.from(hashHex,"hex").length;

  const derivedKey = (await scrypt(password, salt, keyLen)) as Buffer;
  const storedKey = Buffer.from(hashHex, "hex");

  return timingSafeEqual(derivedKey, storedKey)
}
