import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { generateMock } from "./dev/mockModel";
import { getFeatureFlag } from "../../../config/feature-flags"; // Import getFeatureFlag

// Biến để lưu trữ instance OpenAI client (lazy-initialized)
let _openaiClient: OpenAI | null = null;

// Hàm lazy-init OpenAI client
function getOpenAIClient(): OpenAI | null {
  if (_openaiClient) {
    return _openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null; // Không có API key, không khởi tạo client
  }

  _openaiClient = new OpenAI({ apiKey });
  return _openaiClient;
}

// Updated Intent type for cost optimization
export type Intent =
  | "simple_qa"
  | "meal_tip"
  | "reminder_reason"
  | "classify_intent"
  | "complex_coaching"
  | "safety_escalation"
  | "coach_checkin" // Keep existing for compatibility
  | "detect_intent"; // Keep existing for compatibility

// Renamed from routeModel
export function routeModelForIntent(intent: Intent): string {
  switch (intent) {
    case "complex_coaching":
    case "safety_escalation":
      return process.env.MODEL_MINI || "gpt-5-mini";
    default:
      return process.env.MODEL_NANO || "gpt-5-nano";
  }
}

export function maxTokensForIntent(intent: Intent): number {
  switch (intent) {
    case "safety_escalation":
      return 120;
    case "complex_coaching":
      return 100;
    default:
      return 60;
  }
}

// Renamed from generate
export async function callLLM(opts: {
  model: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
  disableRetry?: boolean;
}) {
  const { model, system, prompt, maxTokens = 160, disableRetry = false } = opts;

  // Mock mode để QA 0 token
  if (getFeatureFlag('AI_AGENT_MODE') === "demo" || process.env.LLM_TRANSPORT === "mock") {
    // Adapt generateMock to handle new intents
    const mockIntent = prompt.includes("safety") || prompt.includes("nguy hiểm") ? "safety_escalation" : "coach_checkin";
    return generateMock({ intent: mockIntent as any, ctx: {} as any, message: prompt });
  }

  // Lấy OpenAI client (lazy-initialized)
  const client = getOpenAIClient();
  if (!client) {
    // Nếu không có client (do thiếu API key) và không phải mock mode, ném lỗi
    throw new Error("AI_DISABLED: OPENAI_API_KEY is not set.");
  }

  const messages: ChatCompletionMessageParam[] = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ];

  let res;
  try {
    res = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages,
    });
  } catch (error) {
    if (disableRetry || getFeatureFlag('AI_DISABLE_RETRY')) { // Sử dụng feature flag
      throw error;
    }
    // Basic retry logic
    console.warn("LLM call failed, retrying...", error);
    await new Promise(resolve => setTimeout(resolve, 1000));
    res = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages,
    });
  }

  const text = res.choices[0]?.message?.content?.trim() || "";
  const usage = res.usage
    ? {
        prompt_tokens: res.usage.prompt_tokens,
        completion_tokens: res.usage.completion_tokens,
        total_tokens: res.usage.total_tokens,
      }
    : undefined;

  return { text, usage };
}
