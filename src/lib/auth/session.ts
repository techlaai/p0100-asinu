export interface SessionPayload {
  user_id: string;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
}

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "asinu.sid";
const SESSION_SECRET =
  process.env.AUTH_SECRET || process.env.SESSION_SECRET || "PLEASE_ROTATE_AUTH_SECRET";

const encoder = new TextEncoder();

let keyPromise: Promise<CryptoKey | null> | null = null;

async function getCrypto(): Promise<SubtleCrypto | null> {
  if (typeof crypto === "undefined" || typeof crypto.subtle === "undefined") {
    return null;
  }
  return crypto.subtle;
}

async function getSigningKey(): Promise<CryptoKey | null> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const subtle = await getCrypto();
      if (!subtle) return null;
      return subtle.importKey(
        "raw",
        encoder.encode(SESSION_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
    })();
  }
  return keyPromise;
}

function decodeBase64(base64: string): string | null {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  return null;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      return null;
    }
    bytes[i] = byte;
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function signPayload(payload: string): Promise<Uint8Array | null> {
  const subtle = await getCrypto();
  const key = await getSigningKey();
  if (!subtle || !key) {
    return null;
  }
  const signature = await subtle.sign("HMAC", key, encoder.encode(payload));
  return new Uint8Array(signature);
}

export async function verifySessionValue(raw: string | null | undefined): Promise<SessionPayload | null> {
  if (!raw) return null;
  const [payloadB64, signatureHex] = raw.split(".");
  if (!payloadB64 || !signatureHex) {
    return null;
  }
  const payloadJson = decodeBase64(payloadB64);
  if (!payloadJson) {
    return null;
  }
  const [expectedSignature, providedSignature] = await Promise.all([
    signPayload(payloadJson),
    Promise.resolve(hexToBytes(signatureHex)),
  ]);
  if (!expectedSignature || !providedSignature) {
    return null;
  }
  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(payloadJson) as SessionPayload;
    if (!parsed.user_id) {
      return null;
    }
    return {
      user_id: parsed.user_id,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      display_name: parsed.display_name ?? null,
    };
  } catch {
    return null;
  }
}
