export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "METHOD_NOT_ALLOWED"
  | "DB_UNAVAILABLE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "STORAGE_UNAVAILABLE"
  | "INTERNAL_ERROR";

interface ErrorCodeMeta {
  status: number;
  message: string;
}

const ERROR_CODE_META: Record<ErrorCode, ErrorCodeMeta> = {
  UNAUTHORIZED: { status: 401, message: "Authentication required." },
  FORBIDDEN: { status: 403, message: "You do not have access to this resource." },
  VALIDATION_ERROR: { status: 422, message: "Input validation failed." },
  BAD_REQUEST: { status: 400, message: "Malformed request." },
  NOT_FOUND: { status: 404, message: "Resource not found." },
  CONFLICT: { status: 409, message: "Conflict detected." },
  RATE_LIMITED: { status: 429, message: "Too many requests." },
  METHOD_NOT_ALLOWED: { status: 405, message: "Method not allowed." },
  DB_UNAVAILABLE: { status: 503, message: "Database unavailable." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Unsupported media type." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Payload too large." },
  STORAGE_UNAVAILABLE: { status: 503, message: "Storage temporarily unavailable." },
  INTERNAL_ERROR: { status: 500, message: "Unexpected error." },
};

export function getErrorCodeMeta(code: ErrorCode): ErrorCodeMeta {
  return ERROR_CODE_META[code];
}
