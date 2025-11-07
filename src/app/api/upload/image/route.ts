import nodeCrypto from "crypto";
import { NextRequest } from "next/server";
import { loadS3Config, s3UploadObject } from "@/lib/storage/s3_client";
import { jsonError, jsonSuccess } from "@/lib/http/response";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIGNED_URL_TTL_SECONDS = 600;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getViewTokenSecret(): string | null {
  return process.env.AUTH_SECRET ?? null;
}

function createViewToken(key: string, ttlSeconds: number, secret: string): string {
  const payload = {
    key,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = nodeCrypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function buildSignedUrl(req: NextRequest, token: string): string {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host") ?? new URL(req.url).host;
  const protocol = forwardedProto ?? (req.headers.get("host")?.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}/api/upload/image/view?token=${encodeURIComponent(token)}`;
}

export async function POST(req: NextRequest) {
  try {
    const config = loadS3Config();
    if (!config) {
      return jsonError("STORAGE_UNAVAILABLE", {
        request: req,
        message: "Cấu hình lưu trữ tạm thời không khả dụng.",
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError("VALIDATION_ERROR", {
        request: req,
        message: "Thiếu tệp upload.",
      });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonError("UNSUPPORTED_MEDIA_TYPE", {
        request: req,
        message: "Định dạng ảnh không được hỗ trợ.",
      });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError("PAYLOAD_TOO_LARGE", {
        request: req,
        message: "Ảnh vượt quá kích thước tối đa 10MB.",
      });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${generateUUID()}.${fileExt}`;
    const filePath = `meal_images/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3UploadObject(config, filePath, buffer, file.type);
    const tokenSecret = getViewTokenSecret();
    if (!tokenSecret) {
      return jsonError("STORAGE_UNAVAILABLE", {
        request: req,
        message: "Cấu hình lưu trữ tạm thời không khả dụng.",
      });
    }

    const token = createViewToken(filePath, SIGNED_URL_TTL_SECONDS, tokenSecret);
    const signedUrl = buildSignedUrl(req, token);

    return jsonSuccess(
      { key: filePath, signed_url: signedUrl, expires_in: SIGNED_URL_TTL_SECONDS },
      { request: req, cacheControl: "no-store" },
    );
  } catch (error: any) {
    if (error?.message?.startsWith("S3_UPLOAD_FAILED")) {
      console.error("[upload/image] S3 upload failed:", error.message);
      return jsonError("STORAGE_UNAVAILABLE", {
        request: req,
        message: "Không thể lưu trữ ảnh vào lúc này.",
      });
    }
    console.error("Upload API error:", error);
    return jsonError("INTERNAL_ERROR", {
      request: req,
      message: error?.message || "Upload thất bại.",
    });
  }
}
