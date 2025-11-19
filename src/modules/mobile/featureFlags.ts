import type { FeatureFlags } from "../../../config/feature-flags";
import { getFeatureFlags } from "../../../config/feature-flags";

export type MobileFeatureFlags = {
  MISSIONS_ENABLED: boolean;
  TREE_ENABLED: boolean;
  REWARDS_ENABLED: boolean;
  DONATE_ENABLED: boolean;
  FAMILY_ENABLED: boolean;
  AI_CHAT_ENABLED: boolean;
  NOTIFICATIONS_ENABLED: boolean;
};

const DEFAULT_FLAGS: MobileFeatureFlags = {
  MISSIONS_ENABLED: false,
  TREE_ENABLED: false,
  REWARDS_ENABLED: false,
  DONATE_ENABLED: false,
  FAMILY_ENABLED: false,
  AI_CHAT_ENABLED: false,
  NOTIFICATIONS_ENABLED: false,
};

export function mapMobileFeatureFlags(flags: FeatureFlags | null | undefined): MobileFeatureFlags {
  if (!flags) return { ...DEFAULT_FLAGS };
  return {
    MISSIONS_ENABLED: Boolean(flags.FEATURE_MISSION),
    TREE_ENABLED: Boolean(flags.TREE_ENABLED),
    REWARDS_ENABLED: Boolean(flags.REWARDS_ENABLED),
    DONATE_ENABLED: Boolean(flags.DONATION_ENABLED),
    FAMILY_ENABLED: Boolean(flags.RELATIVE_ENABLED),
    AI_CHAT_ENABLED: Boolean(flags.AI_COACH_ENABLED && flags.AI_GATEWAY_ENABLED),
    NOTIFICATIONS_ENABLED: Boolean(flags.REALTIME_ENABLED),
  };
}

export function getMobileFeatureFlags(): MobileFeatureFlags {
  return mapMobileFeatureFlags(getFeatureFlags());
}

export function getDefaultMobileFlags(): MobileFeatureFlags {
  return { ...DEFAULT_FLAGS };
}
