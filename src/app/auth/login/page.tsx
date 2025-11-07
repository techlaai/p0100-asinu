"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/http";

type FieldErrors = Record<string, string>;

const EMAIL_REGEX =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function normalizeVietnamPhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("+84")) return digits;
  if (digits.length >= 9 && digits.length <= 11) return `+84${digits}`;
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    contactType: "email" as "email" | "phone",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ tone: "info" | "error"; message: string } | null>(
    null,
  );

  const nextTarget = useMemo(() => {
    const redirect = searchParams?.get("next") || searchParams?.get("redirect");
    return redirect ? new URLSearchParams({ next: redirect }).toString() : "";
  }, [searchParams]);

  useEffect(() => {
    const status = searchParams?.get("status");
    if (status === "registered") {
      setBanner({
        tone: "info",
        message: "Tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await apiFetch<{
          user_id: string;
        }>("/api/auth/session", { cache: "no-store" });
        if (!cancelled && session?.user_id) {
          const target =
            searchParams?.get("next") ||
            searchParams?.get("redirect") ||
            "/dashboard";
          router.replace(target);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return;
        }
        console.warn("Session check failed", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setBanner(null);

    const localErrors: FieldErrors = {};
    if (!formData.password) {
      localErrors.password = "Mật khẩu là bắt buộc.";
    }

    if (formData.contactType === "email") {
      if (!formData.email) {
        localErrors.email = "Email là bắt buộc.";
      } else if (!EMAIL_REGEX.test(formData.email.trim())) {
        localErrors.email = "Email không hợp lệ.";
      }
    } else {
      if (!formData.phone) {
        localErrors.phone = "Số điện thoại là bắt buộc.";
      } else if (!normalizeVietnamPhone(formData.phone)) {
        localErrors.phone = "Số điện thoại không hợp lệ.";
      }
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      const params = nextTarget ? `?${nextTarget}` : "";
      const data = await apiFetch<{ redirect_to?: string }>(`/api/auth/login${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactType: formData.contactType,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      router.replace(data.redirect_to || "/dashboard");
      return;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "VALIDATION_ERROR") {
          const detailPayload = error.payload?.details as
            | { fieldErrors?: Record<string, { message?: string }> }
            | undefined;
          const fieldErrors = detailPayload?.fieldErrors ?? {};
          const mapped: FieldErrors = {};
          Object.entries(fieldErrors).forEach(([key, value]) => {
            mapped[key] = value?.message ?? "Trường này không hợp lệ.";
          });
          setFieldErrors(mapped);
          return;
        }
        if (error.code === "UNAUTHORIZED") {
          setBanner({ tone: "error", message: error.message });
          return;
        }
        setBanner({ tone: "error", message: error.message });
        return;
      }
      console.error("Login error:", error);
      setBanner({
        tone: "error",
        message: "Không thể xử lý đăng nhập vào lúc này.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl text-white">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Chào mừng trở lại</h1>
          <p className="text-gray-600 mt-2">Đăng nhập vào tài khoản DIABOT của bạn</p>
        </div>

        {banner && (
          <div
            className={`mb-4 p-3 rounded-lg border text-sm ${
              banner.tone === "info"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {banner.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Đăng nhập bằng</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, contactType: "email" }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.contactType === "email"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, contactType: "phone" }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.contactType === "phone"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Số điện thoại
              </button>
            </div>
          </div>

          {formData.contactType === "email" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  fieldErrors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="your@email.com"
                autoComplete="username"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  fieldErrors.phone ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0901234567"
                autoComplete="tel"
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Hỗ trợ 0/84/+84. Số sẽ được chuẩn hóa sang định dạng quốc tế.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                fieldErrors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
            <div className="mt-2 text-right">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-700">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Chưa có tài khoản?{" "}
          <Link href="/auth/register" className="text-primary hover:text-primary-700">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
