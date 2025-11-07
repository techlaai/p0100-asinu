import nodeCrypto from "crypto";

const { createHash, createHmac } = nodeCrypto;

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

type SignedRequestOptions = {
  method: "GET" | "PUT" | "DELETE";
  key: string;
  body?: Buffer;
  contentType?: string;
};

const RFC3986_RESERVED = /[!'()*]/g;
const RFC3986_REPLACEMENTS: Record<string, string> = {
  "!": "%21",
  "'": "%27",
  "(": "%28",
  ")": "%29",
  "*": "%2A",
};

function encodeRFC3986(input: string): string {
  return encodeURIComponent(input).replace(RFC3986_RESERVED, (c) => RFC3986_REPLACEMENTS[c]);
}

function hashHex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hmacHex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data, "utf8").digest("hex");
}

function deriveSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function buildCanonicalHeaders(headers: Record<string, string>): {
  canonical: string;
  signedHeaders: string;
} {
  const entries = Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value.trim().replace(/\s+/g, " ")]);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const canonical = entries.map(([key, value]) => `${key}:${value}`).join("\n");
  const signedHeaders = entries.map(([key]) => key).join(";");
  return { canonical: `${canonical}\n`, signedHeaders };
}

function buildCanonicalRequest(
  method: string,
  canonicalUri: string,
  canonicalQuery: string,
  canonicalHeaders: string,
  signedHeaders: string,
  payloadHash: string,
): string {
  return [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
}

function buildStringToSign(amzDate: string, credentialScope: string, canonicalRequestHash: string): string {
  return `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
}

function formatAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function buildCredentialScope(dateStamp: string, region: string, service: string): string {
  return `${dateStamp}/${region}/${service}/aws4_request`;
}

function buildObjectUrl(config: S3Config, key: string): { url: URL; canonicalUri: string; host: string } {
  const encodedKey = key
    .split("/")
    .map((part) => encodeRFC3986(part))
    .join("/");

  const url = new URL(config.endpoint);
  if (config.forcePathStyle) {
    url.pathname = `/${config.bucket}/${encodedKey}`;
  } else {
    url.hostname = `${config.bucket}.${url.hostname}`;
    url.pathname = `/${encodedKey}`;
  }
  url.search = "";
  return { url, canonicalUri: url.pathname, host: url.host };
}

export function loadS3Config(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE ?? "").toLowerCase() === "true";

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
  };
}

async function signedFetch(config: S3Config, options: SignedRequestOptions): Promise<Response> {
  const { method, key, body, contentType } = options;
  const { url, canonicalUri, host } = buildObjectUrl(config, key);

  const now = new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const scope = buildCredentialScope(dateStamp, config.region, "s3");

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
  };

  let payloadHash = "UNSIGNED-PAYLOAD";
  let requestBody: Buffer | undefined;

  if (body) {
    requestBody = body;
    payloadHash = hashHex(body);
    headers["x-amz-content-sha256"] = payloadHash;
  } else {
    headers["x-amz-content-sha256"] = "UNSIGNED-PAYLOAD";
  }

  if (contentType) {
    headers["content-type"] = contentType;
  }

  const { canonical: canonicalHeaders, signedHeaders } = buildCanonicalHeaders(headers);
  const canonicalRequest = buildCanonicalRequest(
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  );
  const stringToSign = buildStringToSign(amzDate, scope, hashHex(canonicalRequest));
  const signingKey = deriveSigningKey(config.secretAccessKey, dateStamp, config.region, "s3");
  const signature = hmacHex(signingKey, stringToSign);

  const authorizationHeader = [
    "AWS4-HMAC-SHA256 Credential=",
    `${config.accessKeyId}/${scope}`,
    ", SignedHeaders=",
    signedHeaders,
    ", Signature=",
    signature,
  ].join("");

  const fetchHeaders: Record<string, string> = {
    Authorization: authorizationHeader,
    "X-Amz-Date": amzDate,
    "X-Amz-Content-Sha256": headers["x-amz-content-sha256"],
  };

  if (contentType) {
    fetchHeaders["Content-Type"] = contentType;
  }

  return fetch(url, {
    method,
    body: requestBody,
    headers: fetchHeaders,
  });
}

export async function s3UploadObject(config: S3Config, key: string, buffer: Buffer, contentType: string): Promise<void> {
  const response = await signedFetch(config, {
    method: "PUT",
    key,
    body: buffer,
    contentType,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`S3_UPLOAD_FAILED:${response.status}:${text}`);
  }
}

export async function s3GetObject(config: S3Config, key: string): Promise<Response> {
  return signedFetch(config, {
    method: "GET",
    key,
  });
}
