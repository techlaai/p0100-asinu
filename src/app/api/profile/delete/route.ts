import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/getUserId";
import { query } from "@/lib/db_client";
import { jsonError, jsonSuccess } from "@/lib/http/response";

export async function DELETE(req: NextRequest) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  try {
    await query(
      `DELETE FROM app_user WHERE user_id = $1`,
      [userId],
    );
    return jsonSuccess(
      { message: "Account deleted successfully" },
      { request: req, cacheControl: "no-store" },
    );
  } catch (error) {
    console.error("DELETE /api/profile/delete failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
