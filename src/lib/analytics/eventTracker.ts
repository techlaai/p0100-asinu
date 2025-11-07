// src/lib/analytics/eventTracker.ts
// Event tracking utility for analytics_events table

import { query } from '@/lib/db_client';

export type EventType =
  | 'meal.logged'
  | 'tip.shown'
  | 'tip.applied'
  | 'user.corrected'
  | 'preference.changed'
  | 'consent.updated';

export interface EventPayload {
  [key: string]: any;
}

export interface TrackEventParams {
  eventType: EventType;
  userId: string;
  requestId: string;
  payload?: EventPayload;
  schemaVersion?: number;
}

/**
 * Track event to analytics_events table
 * Fire-and-forget pattern (async, don't block main flow)
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  const {
    eventType,
    userId,
    requestId,
    payload = {},
    schemaVersion = 1
  } = params;

  try {
    await query(
      `INSERT INTO analytics_events (
        event_type,
        schema_version,
        request_id,
        user_id,
        payload,
        created_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, now())`,
      [eventType, schemaVersion, requestId, userId, JSON.stringify(payload)],
    );
  } catch (err) {
    // Silent fail - don't break user flow
    console.error('Event tracking error:', err);
  }
}

/**
 * Track meal.logged event
 * Payload minimal: no PII, no food names
 */
export async function trackMealLogged(
  userId: string,
  requestId: string,
  mealData: {
    meal_type?: string;
    items?: any[];
    carbs_g?: number;
    protein_g?: number;
    fat_g?: number;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'meal.logged',
    userId,
    requestId,
    payload: {
      meal_type: mealData.meal_type,
      item_count: mealData.items?.length || 0,
      has_macros: !!(mealData.carbs_g || mealData.protein_g || mealData.fat_g)
      // Do NOT include food names or images (PII)
    }
  });
}

/**
 * Track tip.shown event
 * Payload minimal: no PII, no tip content
 */
export async function trackTipShown(
  userId: string,
  requestId: string,
  tipData: {
    source: 'rule-based' | 'ml';
    length: number;
    suggestion_count: number;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'tip.shown',
    userId,
    requestId,
    payload: {
      source: tipData.source,
      length: tipData.length,
      suggestion_count: tipData.suggestion_count
      // Do NOT include tip text content (PII/privacy)
    }
  });
}

/**
 * Track tip.applied event
 */
export async function trackTipApplied(
  userId: string,
  requestId: string,
  appliedData: {
    suggestion_index: number;
    applied_fully: boolean;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'tip.applied',
    userId,
    requestId,
    payload: appliedData
  });
}

/**
 * Track user.corrected event
 */
export async function trackUserCorrected(
  userId: string,
  requestId: string,
  correctionData: {
    field: string;
    original_value: any;
    corrected_value: any;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'user.corrected',
    userId,
    requestId,
    payload: correctionData
  });
}

/**
 * Track preference.changed event
 */
export async function trackPreferenceChanged(
  userId: string,
  requestId: string,
  preferenceData: {
    preference_key: string;
    old_value: any;
    new_value: any;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'preference.changed',
    userId,
    requestId,
    payload: preferenceData
  });
}

/**
 * Track consent.updated event
 */
export async function trackConsentUpdated(
  userId: string,
  requestId: string,
  consentData: {
    consent_type: string;
    granted: boolean;
  }
): Promise<void> {
  await trackEvent({
    eventType: 'consent.updated',
    userId,
    requestId,
    payload: consentData
  });
}

/**
 * Generate request ID (UUID v4)
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
