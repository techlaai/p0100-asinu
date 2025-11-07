import { NextResponse } from "next/server";

interface EvaluateResponse {
  summary: string;
  findings: string[];
  actions: string[];
  score: number;
}

interface ErrorResponse {
  error: string;
  detail: string;
}

const MAX_BODY_SIZE = 256 * 1024; // 256KB
const GATEWAY_TIMEOUT = 12000; // 12 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function callGatewayWithRetry(gatewayUrl: string, payload: any, idempotencyKey: string): Promise<Response> {
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      intent: "qa_review",
      payload
    })
  };

  try {
    // First attempt
    const response = await fetchWithTimeout(gatewayUrl, requestOptions, GATEWAY_TIMEOUT);
    
    // Retry once on 5xx errors
    if (response.status >= 500) {
      console.log(`Gateway returned ${response.status}, retrying once...`);
      return await fetchWithTimeout(gatewayUrl, requestOptions, GATEWAY_TIMEOUT);
    }
    
    return response;
  } catch (error) {
    // Single retry on network errors
    console.log(`Gateway request failed, retrying once...`);
    return await fetchWithTimeout(gatewayUrl, requestOptions, GATEWAY_TIMEOUT);
  }
}

export async function POST(request: Request): Promise<NextResponse<EvaluateResponse | ErrorResponse>> {
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // Check body size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({
        error: "Payload Too Large",
        detail: `Request body exceeds ${MAX_BODY_SIZE} bytes limit`
      }, { status: 413 });
    }

    // Get gateway URL
    const gatewayUrl = process.env.AI_GATEWAY_URL;
    if (!gatewayUrl) {
      return NextResponse.json({
        error: "Configuration Error",
        detail: "AI_GATEWAY_URL not configured"
      }, { status: 500 });
    }

    // Fetch selftest results
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const selftestResponse = await fetch(`${appUrl}/api/qa/selftest`, {
      cache: 'no-store'
    });

    if (!selftestResponse.ok) {
      return NextResponse.json({
        error: "Selftest Failed",
        detail: `Selftest endpoint returned HTTP ${selftestResponse.status}`
      }, { status: 502 });
    }

    const selftestData = await selftestResponse.json();
    
    // Generate idempotency key
    const idempotencyKey = `qa-eval-${runId}`;
    
    // Call AI Gateway with retry logic
    const gatewayResponse = await callGatewayWithRetry(gatewayUrl, selftestData, idempotencyKey);
    
    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      return NextResponse.json({
        error: "Gateway Error",
        detail: `Gateway returned HTTP ${gatewayResponse.status}: ${errorText}`
      }, { status: 502 });
    }

    const gatewayData = await gatewayResponse.json();
    
    // Calculate score based on selftest results
    const { stats } = selftestData;
    const score = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    
    // Generate findings and actions
const failedItems = selftestData.items.filter((item: any) => item.status === "FAIL");
const findings = failedItems.map((item: any) => `${item.title}: ${item.details}`);
    
    const actions: string[] = [];

if (failedItems?.some((item: { id?: string }) => item.id === "env_vars")) {
  actions.push("Configure missing environment variables");
}
if (failedItems?.some((item: { id?: string }) => item.id === "database_connection")) {
  actions.push("Verify database credentials and network connectivity");
}
    if (failedItems?.some((item: { id?: string }) => item.id === "api_health")) {
      actions.push("Check API Gateway deployment and configuration");
    }

    const response: EvaluateResponse = {
      summary: gatewayData.output || `QA evaluation completed. Score: ${score}%. ${findings.length} issues found.`,
      findings,
      actions,
      score
    };

    // Log summary (mask sensitive data)
    const duration = Date.now() - startTime;
    console.log(`[QA] runId=${runId} status=success score=${score} duration=${duration}ms`);

    return NextResponse.json(response);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[QA] runId=${runId} status=error duration=${duration}ms error=${error.message}`);
    
    return NextResponse.json({
      error: "Internal Error",
      detail: error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}
