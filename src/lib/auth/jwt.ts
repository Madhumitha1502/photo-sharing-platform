import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "photo-sharing-platform-jwt-secret-key-default-32chars"
);

const GALLERY_TOKEN_SECRET = new TextEncoder().encode(
  process.env.GALLERY_TOKEN_SECRET || "gallery-access-secret-token-key-default-32chars"
);

export const AUTH_COOKIE_NAME = "psp_token";

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

export interface GalleryTokenPayload {
  gallerySlug: string;
  eventId: string;
  verifiedAt: number;
}

// Password & PIN hashing
export async function hashValue(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function compareValue(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// User JWT
export async function signUserToken(payload: UserTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserTokenPayload;
  } catch {
    return null;
  }
}

// Gallery PIN-verified session token
export async function signGalleryToken(payload: GalleryTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(GALLERY_TOKEN_SECRET);
}

export async function verifyGalleryToken(token: string): Promise<GalleryTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, GALLERY_TOKEN_SECRET);
    return payload as unknown as GalleryTokenPayload;
  } catch {
    return null;
  }
}

// Helper to get current authenticated user from request cookies
export async function getCurrentUser(): Promise<UserTokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyUserToken(token);
}
