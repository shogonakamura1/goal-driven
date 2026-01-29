import { SignJWT } from "jose";
import { randomBytes, createHash } from "crypto";
import { jwtVerify } from "jose";
import { AccessTokenPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_PEPPER = process.env.REFRESH_TOKEN_PEPPER;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
if (!REFRESH_TOKEN_PEPPER) throw new Error("REFRESH_TOKEN_PEPPER is not set");

const jwtKey = new TextEncoder().encode(JWT_SECRET);

export async function issueAccessToken(userId: string) {
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtKey);
}

export function generateRefreshToken() {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(refreshRaw: string) {
  return createHash("sha256")
    .update(refreshRaw)
    .update(REFRESH_TOKEN_PEPPER!)
    .digest("hex");
}

export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, jwtKey);
  
  const userId = payload.sub;
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("ACCESS_TOKEN_SUB_MISSING");
  }

  return { userId };
}
