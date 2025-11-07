import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { trackPreferenceChanged } from "@/lib/analytics/eventTracker";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { ensureRequestId } from "@/lib/logging/request_id";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { extractPersonaPrefs, type PersonaPrefs } from "@/modules/ai/persona";
export const dynamic = 'force-dynamic';

/**
 * PUT /api/profile/personality
 *
 * Update user's AI persona preferences
 *
 * Request body:
 * {
 *   "ai_persona": "friend" | "coach" | "advisor",
 *   "guidance_level": "minimal" | "detailed",
 *   "low_ask_mode": boolean
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "prefs": { ... updated prefs ... },
 *   "meta": { ... }
 * }
 */

const prefsSchema = z.object({
  ai_persona: z.enum(['friend', 'coach', 'advisor']).optional(),
  guidance_level: z.enum(['minimal', 'detailed']).optional(),
  low_ask_mode: z.boolean().optional()
});

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  const requestId = ensureRequestId(request);
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request, requestId });
  }

  const body = await request.json().catch(() => null);
  const validation = prefsSchema.safeParse(body);
  if (!validation.success) {
    return jsonError("VALIDATION_ERROR", {
      request: request,
      requestId,
      details: validation.error.flatten(),
    });
  }

  try {
    const updates = validation.data;
    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.getById(userId);

    if (!profile) {
      return jsonError("NOT_FOUND", {
        request: request,
        requestId,
        message: "Profile not found.",
      });
    }

    const currentPrefs = extractPersonaPrefs(profile.prefs);
    const newPrefs: PersonaPrefs = {
      ai_persona: updates.ai_persona ?? currentPrefs.ai_persona,
      guidance_level: updates.guidance_level ?? currentPrefs.guidance_level,
      low_ask_mode: updates.low_ask_mode ?? currentPrefs.low_ask_mode,
    };

    await profilesRepo.update(userId, {
      prefs: { ...newPrefs },
    });

    (Object.keys(updates) as Array<keyof PersonaPrefs>).forEach((key) => {
      const value = updates[key];
      const previous = currentPrefs[key];
      if (value !== undefined && value !== previous) {
        trackPreferenceChanged(userId, requestId, {
          preference_key: key,
          old_value: previous,
          new_value: value,
        }).catch((err) => console.error("Failed to track preference change:", err));
      }
    });

    console.info({
      request_id: requestId,
      user_id: userId,
      updates,
      response_time_ms: Date.now() - startTime,
    });

    return jsonSuccess(
      {
        prefs: newPrefs,
        meta: {
          request_id: requestId,
          time: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
        },
      },
      { request: request, requestId, cacheControl: "no-store" },
    );
  } catch (error) {
    console.error("Error in /api/profile/personality:", error);
    return jsonError("INTERNAL_ERROR", { request: request, requestId });
  }
}

/**
 * GET /api/profile/personality
 *
 * Get user's current AI persona preferences
 */
export async function GET(request: NextRequest) {
  const requestId = ensureRequestId(request);
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request, requestId });
  }

  try {
    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.getById(userId);

    if (!profile) {
      return jsonError("NOT_FOUND", {
        request: request,
        requestId,
        message: "Profile not found.",
      });
    }

    const prefs = extractPersonaPrefs(profile.prefs);

    return jsonSuccess(
      {
        prefs,
        meta: {
          time: new Date().toISOString(),
        },
      },
      { request: request, requestId },
    );
  } catch (error) {
    console.error("Error in GET /api/profile/personality:", error);
    return jsonError("INTERNAL_ERROR", { request: request, requestId });
  }
}
