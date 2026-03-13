import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { cookies } from "next/headers";

const secret: string = process.env.JWT_SECRET || "seu_super_secret_key_mudeme";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "USER" | "RESIDENT";
}

export function signToken(payload: JWTPayload, expiresIn: string | number = "7d"): string {
  const options: SignOptions = {
    algorithm: "HS256",
  };
  if (expiresIn) {
    (options as any).expiresIn = expiresIn;
  }
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: ["HS256"],
    };
    const verified = jwt.verify(token, secret, options) as JWTPayload;
    return verified;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}
