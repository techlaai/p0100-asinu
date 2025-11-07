import { NextRequest } from "next/server";
import { z } from "zod";
import type { Profile } from "@/domain/types";
import { requireAuth } from "@/lib/auth/getUserId";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { jsonError, jsonSuccess } from "@/lib/http/response";

const updateSchema = z
  .record(z.unknown())
  .refine(
    (value) => value && typeof value === "object" && !Array.isArray(value),
    { message: "Payload must be an object." },
  )
  .transform((value) => value as Record<string, unknown>);

async function ensureSelfAccess(req: NextRequest, paramsId: string) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return { error: jsonError("UNAUTHORIZED", { request: req }) };
  }
  if (userId !== paramsId) {
    return { error: jsonError("FORBIDDEN", { request: req }) };
  }
  return { userId };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await ensureSelfAccess(req, params.id);
  if ("error" in access) return access.error;

  try {
    const repo = new ProfilesRepo();
    const profile = await repo.getById(access.userId);
    if (!profile) {
      return jsonError("NOT_FOUND", { request: req, message: "Profile not found." });
    }
    return jsonSuccess(profile, { request: req });
  } catch (error) {
    console.error("GET /api/profile/[id] failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await ensureSelfAccess(req, params.id);
  if ("error" in access) return access.error;

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", {
      request: req,
      details: parsed.error.flatten(),
    });
  }

  try {
    const repo = new ProfilesRepo();
    const updated = await repo.update(access.userId, parsed.data as Partial<Profile>);
    return jsonSuccess(updated, { request: req, cacheControl: "no-store" });
  } catch (error) {
    console.error("PUT /api/profile/[id] failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
