import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileProfile } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const profile = await getMobileProfile(session.user_id);
  if (!profile) {
    return jsonError("NOT_FOUND", { request: req, message: "Profile not found." });
  }

  return jsonSuccess(profile, { request: req, cacheControl: "no-store" });
}
