import nodeCrypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadS3Config, s3GetObject } from "@/lib/storage/s3_client";

type ViewTokenPayload = {
  key: string;
  exp: number;
};

function getViewTokenSecret(): string | null {
  return process.env.AUTH_SECRET ?? null;
}

function isSafeKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith("/") || key.startsWith("\\")) return false;
  if (key.includes("..")) return false;
  return true;
}

function verifyToken(token: string, secret: string): ViewTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expectedSignature = nodeCrypto.createHmac("sha256", secret).update(body).digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !nodeCrypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const payload = JSON.parse(json) as ViewTokenPayload;
    if (!payload || typeof payload.key !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!isSafeKey(payload.key)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const tokenSecret = getViewTokenSecret();
  if (!tokenSecret) {
    return NextResponse.json(
      { code: "S3_UNAVAILABLE", message: "Không thể tải ảnh vào lúc này." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ code: "TOKEN_REQUIRED", message: "Thiếu tham số token." }, { status: 400 });
  }

  const payload = verifyToken(token, tokenSecret);
  if (!payload) {
    return NextResponse.json(
      { code: "TOKEN_INVALID", message: "Đường dẫn đã hết hạn hoặc không hợp lệ." },
      { status: 403 },
    );
  }

  const config = loadS3Config();
  if (!config) {
    return NextResponse.json(
      { code: "S3_UNAVAILABLE", message: "Không thể tải ảnh vào lúc này." },
      { status: 503 },
    );
  }

  try {
    const s3Response = await s3GetObject(config, payload.key);
    if (!s3Response.ok) {
      if (s3Response.status === 404) {
        return NextResponse.json({ code: "NOT_FOUND", message: "Ảnh không tồn tại." }, { status: 404 });
      }
      const text = await s3Response.text().catch(() => "");
      console.error("[upload/image/view] S3 get failed:", s3Response.status, text);
      return NextResponse.json(
        { code: "S3_UNAVAILABLE", message: "Không thể tải ảnh vào lúc này." },
        { status: 503 },
      );
    }

    const buffer = Buffer.from(await s3Response.arrayBuffer());
    const headers = new Headers();
    const contentType = s3Response.headers.get("content-type") ?? "application/octet-stream";
    headers.set("Content-Type", contentType);
    const contentLength = s3Response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Cache-Control", "private, max-age=0, must-revalidate");

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error("[upload/image/view] error:", error);
    return NextResponse.json(
      { code: "S3_UNAVAILABLE", message: "Không thể tải ảnh vào lúc này." },
      { status: 503 },
    );
  }
}
