import { NextRequest } from "next/server";
import { query } from "@/lib/db_client";
import { verifyPassword } from "@/lib/auth/password";
import { setSession, clearSession } from "@/infrastructure/auth/session";
import { jsonError, jsonSuccess } from "@/lib/http/response";

type LoginBody = {
  contactType?: "email" | "phone";
  email?: string;
  phone?: string;
  password?: string;
};

const EMAIL_REGEX =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function normalizeVietnamPhone(input?: string | null) {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("+84")) return digits;
  if (digits.length >= 9 && digits.length <= 11) return `+84${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as LoginBody;
  const contactType = payload.contactType ?? (payload.phone ? "phone" : "email");
  const password = payload.password ?? "";

  if (!password) {
    return jsonError("VALIDATION_ERROR", {
      request: req,
      details: {
        fieldErrors: {
          password: {
            code: "PASSWORD_REQUIRED",
            message: "Mật khẩu là bắt buộc.",
          },
        },
      },
    });
  }

  let normalizedEmail: string | null = null;
  let normalizedPhone: string | null = null;

  if (contactType === "phone") {
    normalizedPhone = normalizeVietnamPhone(payload.phone);
    if (!payload.phone) {
      return jsonError("VALIDATION_ERROR", {
        request: req,
        details: {
          fieldErrors: {
            phone: {
              code: "PHONE_REQUIRED",
              message: "Số điện thoại là bắt buộc.",
            },
          },
        },
      });
    }
    if (!normalizedPhone) {
      return jsonError("VALIDATION_ERROR", {
        request: req,
        details: {
          fieldErrors: {
            phone: {
              code: "PHONE_INVALID",
              message: "Số điện thoại không hợp lệ.",
            },
          },
        },
      });
    }
  } else {
    normalizedEmail = normalizeEmail(payload.email);
    if (!payload.email) {
      return jsonError("VALIDATION_ERROR", {
        request: req,
        details: {
          fieldErrors: {
            email: {
              code: "EMAIL_REQUIRED",
              message: "Email là bắt buộc.",
            },
          },
        },
      });
    }
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return jsonError("VALIDATION_ERROR", {
        request: req,
        details: {
          fieldErrors: {
            email: {
              code: "EMAIL_INVALID",
              message: "Email không hợp lệ.",
            },
          },
        },
      });
    }
  }

  const sql =
    contactType === "phone"
      ? `SELECT u.user_id, u.email, u.phone, u.display_name, s.prefs
         FROM app_user u
         LEFT JOIN user_settings s ON s.user_id = u.user_id
         WHERE u.phone = $1
         LIMIT 1`
      : `SELECT u.user_id, u.email, u.phone, u.display_name, s.prefs
         FROM app_user u
         LEFT JOIN user_settings s ON s.user_id = u.user_id
         WHERE lower(u.email) = $1
         LIMIT 1`;

  const value = contactType === "phone" ? normalizedPhone : normalizedEmail;
  const account = await query<{
    user_id: string;
    email: string | null;
    phone: string | null;
    display_name: string | null;
    prefs: any;
  }>(
    sql,
    [value],
  );

  const user = account.rows[0];
  const prefs = (user?.prefs ?? {}) as any;
  const storedHash =
    prefs?.auth?.password_hash ?? prefs?.password_hash ?? null;

  const isValid = user && storedHash ? await verifyPassword(password, storedHash) : false;
  if (!isValid) {
    const res = jsonError("UNAUTHORIZED", {
      request: req,
      message: "Sai thông tin đăng nhập.",
    });
    clearSession(res);
    return res;
  }

  const url = new URL(req.url);
  const redirectTo =
    url.searchParams.get("next") ||
    url.searchParams.get("redirect") ||
    "/dashboard";

  const res = jsonSuccess(
    {
      code: "LOGIN_SUCCESS",
      message: "Đăng nhập thành công.",
      redirect_to: redirectTo,
    },
    { request: req, cacheControl: "no-store" },
  );

  setSession(res, {
    user_id: user.user_id,
    email: user.email,
    phone: user.phone,
    display_name: user.display_name,
  });

  return res;
}
