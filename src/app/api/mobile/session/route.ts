import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileFeatureFlags } from "@/modules/mobile/featureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const featureFlags = getMobileFeatureFlags();
  const apiBaseUrl = process.env.MOBILE_API_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const env = {
    apiBaseUrl,
    bridgeConfigured: Boolean(process.env.BRIDGE_URL && process.env.BRIDGE_KEY),
    appVersion: process.env.MOBILE_APP_VERSION ?? "dev",
  };

  return jsonSuccess(
    {
      user: {
        user_id: session.user_id,
        display_name: session.display_name ?? null,
        email: session.email ?? null,
        phone: session.phone ?? null,
      },
      featureFlags,
      env,
    },
    { request: req, cacheControl: "no-store" },
  );
}
