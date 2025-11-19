import { query } from "@/lib/db_client";
import { missionService } from "@/modules/mission/service";
import { getTreeState } from "@/modules/tree/service";
import { fetchRewardCatalog, redeemRewardItem, recordDonation } from "@/modules/rewards/service";
import { familyService } from "@/modules/family/service";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { getMobileFeatureFlags, type MobileFeatureFlags } from "@/modules/mobile/featureFlags";

type MissionLog = {
  id: string;
  ts: string;
  points: number;
  metadata: Record<string, unknown>;
};

export async function getMobileDashboard(userId: string, displayName?: string) {
  const flags = getMobileFeatureFlags();
  const [missions, tree, donate] = await Promise.all([
    flags.MISSIONS_ENABLED ? missionService.getTodayMissions(userId).catch(() => null) : null,
    flags.TREE_ENABLED ? getTreeState(userId).catch(() => null) : null,
    flags.DONATE_ENABLED ? getDonationSummary(userId).catch(() => null) : null,
  ]);

  return {
    greeting: displayName ? `Xin chào ${displayName}` : "Xin chào",
    missions: missions?.missions
      ? missions.missions.map((mission) => ({
          id: mission.mission_id,
          title: mission.title,
          cluster: mission.cluster,
          status: mission.status,
          energy: mission.energy,
          completed_count: mission.completed_count,
        }))
      : [],
    summary: missions?.summary ?? null,
    energy: tree
      ? {
          level: tree.level,
          total_points: tree.total_points,
          e_day: tree.e_day,
          streak: tree.streak,
        }
      : null,
    donate: donate
      ? {
          total_points: donate.total_points,
          total_vnd: donate.total_vnd,
          highlight: donate.recent[0] ?? null,
        }
      : null,
  };
}

export async function getMobileMissionDetail(userId: string, missionId: string) {
  const missions = await missionService.getTodayMissions(userId);
  const mission = missions.missions.find((item) => item.mission_id === missionId);
  if (!mission) return null;

  const logs = await fetchMissionLogs(userId, missionId);
  return {
    id: mission.mission_id,
    title: mission.title,
    cluster: mission.cluster,
    status: mission.status,
    completed_count: mission.completed_count,
    energy: mission.energy,
    max_per_day: mission.max_per_day,
    logs,
  };
}

async function fetchMissionLogs(userId: string, missionId: string): Promise<MissionLog[]> {
  const res = await query<{ id: string; ts: Date; points: number; metadata: Record<string, unknown> | null }>(
    `SELECT id, ts, points, metadata
     FROM mission_log
     WHERE user_id = $1 AND mission_id = $2
     ORDER BY ts DESC
     LIMIT 10`,
    [userId, missionId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    ts: row.ts instanceof Date ? row.ts.toISOString() : (row.ts as any),
    points: Number(row.points ?? 0),
    metadata: row.metadata ?? {},
  }));
}

export async function getMobileRewardsCatalog(userId: string) {
  return fetchRewardCatalog(userId);
}

export async function getMobileRewardDetail(userId: string, rewardId: string) {
  const catalog = await fetchRewardCatalog(userId);
  const item = catalog.items.find((entry) => entry.id === rewardId);
  if (!item) return null;
  return {
    item,
    balance: catalog.balance,
    supporter_badge: catalog.supporter_badge,
  };
}

export async function redeemMobileReward(userId: string, rewardId: string) {
  return redeemRewardItem(userId, rewardId);
}

export async function getDonationSummary(userId: string) {
  const [totals, recent] = await Promise.all([
    query<{ total_points: string | number | null; total_vnd: string | number | null }>(
      `SELECT COALESCE(SUM(amount_points), 0)::text AS total_points,
              COALESCE(SUM(amount_vnd), 0)::text AS total_vnd
       FROM donation_log
       WHERE user_id = $1`,
      [userId],
    ),
    query<{ id: string; provider: string; amount_points: number; amount_vnd: number; status: string; created_at: Date }>(
      `SELECT id, provider, amount_points, amount_vnd, status, created_at
       FROM donation_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId],
    ),
  ]);

  return {
    total_points: Number(totals.rows[0]?.total_points ?? 0),
    total_vnd: Number(totals.rows[0]?.total_vnd ?? 0),
    recent: recent.rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      amount_points: Number(row.amount_points ?? 0),
      amount_vnd: Number(row.amount_vnd ?? 0),
      status: row.status,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at as any),
    })),
  };
}

export async function createMobileDonation(userId: string, params: { provider: string; amount_points?: number; amount_vnd?: number }) {
  return recordDonation(userId, {
    provider: params.provider,
    amountPoints: params.amount_points ?? 0,
    amountVnd: params.amount_vnd ?? 0,
  });
}

export async function getMobileProfile(userId: string) {
  const repo = new ProfilesRepo();
  const profile = await repo.getById(userId);
  if (!profile) return null;
  return {
    user_id: profile.user_id,
    display_name: profile.display_name,
    email: profile.email,
    phone: profile.phone,
    goal: profile.goal,
    energy: profile.prefs?.energy ?? null,
    badges: Array.isArray(profile.prefs?.badges) ? profile.prefs?.badges : [],
  };
}

export async function getMobileFamilyOverview(userId: string, flags?: MobileFeatureFlags) {
  const featureFlags = flags ?? getMobileFeatureFlags();
  if (!featureFlags.FAMILY_ENABLED) {
    return {
      members: [],
      invites: [],
    };
  }
  const relatives = await familyService.listRelatives(userId);
  return {
    members: relatives.map((relative) => ({
      id: relative.id,
      name: relative.profile.display_name ?? relative.profile.email ?? relative.profile.phone ?? "Người thân",
      relation: relative.relation,
      role: relative.role,
    })),
    invites: [],
  };
}

export async function getMobileTree(userId: string) {
  return getTreeState(userId);
}
