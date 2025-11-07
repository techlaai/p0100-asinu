import { NextResponse } from "next/server";
import { clearSession } from "@/infrastructure/auth/session";

export async function POST() {
  const res = NextResponse.json({ code: "LOGOUT_SUCCESS" }, { status: 200 });
  clearSession(res);
  return res;
}

export async function DELETE() {
  return POST();
}
