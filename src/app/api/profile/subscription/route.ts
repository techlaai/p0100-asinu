import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { jsonError, jsonSuccess } from "@/lib/http/response";

const MOCK_SUBSCRIPTIONS = new Map<string, any>();
const updateSchema = z.object({
  action: z.enum(["upgrade", "cancel"]),
  plan: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request });
  }

  try {
    let subscription = MOCK_SUBSCRIPTIONS.get(userId);
    if (!subscription) {
      subscription = {
        status: "trial",
        plan: "free",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          ai_agent: true,
          charts: true,
          export: true,
          reminders: true,
          family_sharing: false,
          premium_insights: false,
        },
        usage: {
          ai_requests_today: 5,
          ai_requests_limit: 50,
          storage_used_mb: 12.5,
          storage_limit_mb: 100,
        },
      };
      MOCK_SUBSCRIPTIONS.set(userId, subscription);
    }

    return jsonSuccess(subscription, { request: request });
  } catch (error) {
    console.error("Error in /api/profile/subscription GET:", error);
    return jsonError("INTERNAL_ERROR", { request: request });
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", { request: request, details: parsed.error.flatten() });
  }

  try {
    const { action, plan } = parsed.data;
    let subscription = MOCK_SUBSCRIPTIONS.get(userId) || {};

    if (action === "upgrade") {
      subscription = {
        ...subscription,
        status: "active",
        plan: plan || "premium",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        features: {
          ...subscription.features,
          family_sharing: true,
          premium_insights: true,
        },
      };
    } else if (action === "cancel") {
      subscription = {
        ...subscription,
        status: "cancelled",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    MOCK_SUBSCRIPTIONS.set(userId, subscription);

    return jsonSuccess(subscription, { request: request, cacheControl: "no-store" });
  } catch (error) {
    console.error("Error in /api/profile/subscription POST:", error);
    return jsonError("INTERNAL_ERROR", { request: request });
  }
}
