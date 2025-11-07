import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";

export async function getUserId(req?: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user_id ?? null;
}

export async function requireAuth(req?: NextRequest): Promise<string> {
  const userId = await getUserId(req);
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}
