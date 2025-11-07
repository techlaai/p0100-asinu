import { NextResponse } from "next/server";
import { query } from "@/lib/db_client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: "ok" | "error";
      latency_ms?: number;
      error?: string;
    };
    storage: {
      status: "ok" | "error" | "not_configured";
      provider?: string;
      error?: string;
    };
    environment: {
      status: "ok" | "error";
      missing_vars?: string[];
    };
  };
}

async function checkDatabase(): Promise<HealthCheckResult["checks"]["database"]> {
  try {
    const startTime = Date.now();

    await query("SELECT 1");

    return {
      status: "ok",
      latency_ms: Date.now() - startTime,
    };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

function checkStorage(): HealthCheckResult["checks"]["storage"] {
  const provider = process.env.STORAGE_PROVIDER || "not_configured";

  if (provider === "viettel") {
    // Check Viettel Cloud S3 configuration
    const requiredVars = [
      "S3_ENDPOINT",
      "S3_REGION",
      "S3_ACCESS_KEY",
      "S3_SECRET_KEY",
    ];

    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      return {
        status: "error",
        provider: "viettel",
        error: `Missing variables: ${missing.join(", ")}`,
      };
    }

    // Check for placeholder values
    if (process.env.S3_ACCESS_KEY === "TO_BE_PROVIDED") {
      return {
        status: "error",
        provider: "viettel",
        error: "Storage credentials not configured (placeholder values detected)",
      };
    }

    return {
      status: "ok",
      provider: "viettel",
    };
  }

  return {
    status: "not_configured",
    provider: provider === "not_configured" ? undefined : provider,
  };
}

function checkEnvironment(): HealthCheckResult["checks"]["environment"] {
  const requiredVars = [
    "DIABOT_DB_URL",
  ];

  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    return {
      status: "error",
      missing_vars: missing,
    };
  }

  return {
    status: "ok",
  };
}

export async function GET() {
  const [dbCheck, storageCheck, envCheck] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkStorage()),
    Promise.resolve(checkEnvironment()),
  ]);

  // Determine overall health status
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  if (dbCheck.status === "error" || envCheck.status === "error") {
    status = "unhealthy";
  } else if (storageCheck.status === "error") {
    status = "degraded";
  }

  const result: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "0.9.0",
    checks: {
      database: dbCheck,
      storage: storageCheck,
      environment: envCheck,
    },
  };

  // Return appropriate HTTP status
  const httpStatus = status === "unhealthy" ? 503 : 200;

  return NextResponse.json(result, { status: httpStatus });
}
