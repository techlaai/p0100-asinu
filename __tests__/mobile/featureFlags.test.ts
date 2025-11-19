import { describe, expect, it } from "vitest";
import { mapMobileFeatureFlags } from "@/modules/mobile/featureFlags";

describe("mapMobileFeatureFlags", () => {
  it("maps server flags to mobile booleans", () => {
    const result = mapMobileFeatureFlags({
      FEATURE_MISSION: true,
      TREE_ENABLED: true,
      REWARDS_ENABLED: true,
      DONATION_ENABLED: true,
      RELATIVE_ENABLED: true,
      AI_COACH_ENABLED: true,
      AI_GATEWAY_ENABLED: true,
      REALTIME_ENABLED: true,
      AI_AGENT_MODE: "demo",
      CHARTS_ENABLED: true,
      BACKGROUND_SYNC: false,
      REALTIME_ENABLED: true,
      DEBUG_MODE: false,
      CHART_USE_DEMO_DATA: false,
      CHART_FALLBACK: false,
      KILL_SWITCH_ENABLED: false,
      AUTH_DEV_MODE: false,
      MEAL_MOCK_MODE: false,
      REMINDER_MOCK_MODE: false,
      NUDGE_ENABLED: false,
      SAFETY_RULES_ENABLED: false,
      DONATION_ENABLED: true,
      AI_CACHE_ENABLED: true,
      AI_BUDGET_ENABLED: false,
      AI_BUDGET_DROP_ON_EXCEEDED: true,
      AI_DISABLE_RETRY: false,
      AI_RULES_FALLBACK_ENABLED: true,
      AI_GATEWAY_ENABLED: true,
      AI_COACH_ENABLED: true,
      AI_MEAL_ENABLED: false,
      AI_VOICE_ENABLED: false,
      AI_FAMILY_ENABLED: false,
      AI_REWARD_ENABLED: false,
      AI_PERSONALIZATION_DEEP: false,
      AI_MARKETPLACE: false,
      AI_FEDERATED_LEARNING: false,
      AI_GAMIFICATION_DEEP: false,
    } as any);

    expect(result).toEqual({
      MISSIONS_ENABLED: true,
      TREE_ENABLED: true,
      REWARDS_ENABLED: true,
      DONATE_ENABLED: true,
      FAMILY_ENABLED: true,
      AI_CHAT_ENABLED: true,
      NOTIFICATIONS_ENABLED: true,
    });
  });

  it("falls back to defaults when undefined", () => {
    expect(mapMobileFeatureFlags(undefined)).toEqual({
      MISSIONS_ENABLED: false,
      TREE_ENABLED: false,
      REWARDS_ENABLED: false,
      DONATE_ENABLED: false,
      FAMILY_ENABLED: false,
      AI_CHAT_ENABLED: false,
      NOTIFICATIONS_ENABLED: false,
    });
  });
});
