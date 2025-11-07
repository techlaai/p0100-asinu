import { Profile } from "@/domain/types";
import { query } from "@/lib/db_client";

const APP_USER_FIELDS = new Set<keyof Partial<Profile>>([
  "user_id",
  "id",
  "display_name",
  "email",
  "phone",
  "dob",
  "sex",
  "timezone",
]);

const USER_SETTINGS_FIELDS = new Set<keyof Partial<Profile>>([
  "unit_glucose",
  "bg_target_min_mgdl",
  "bg_target_max_mgdl",
  "carb_ratio_g_per_u",
  "insulin_sensitivity_mgdl_per_u",
  "reminder_flags",
  "height_cm",
  "weight_kg",
  "waist_cm",
  "goal",
  "conditions",
  "prefs",
]);

function mapRowToProfile(row: any): Profile {
  const {
    user_id,
    display_name,
    email,
    phone,
    dob,
    sex,
    timezone,
    created_at,
    updated_at,
    unit_glucose,
    bg_target_min_mgdl,
    bg_target_max_mgdl,
    carb_ratio_g_per_u,
    insulin_sensitivity_mgdl_per_u,
    reminder_flags,
    height_cm,
    weight_kg,
    waist_cm,
    goal,
    conditions,
    prefs,
    settings_created_at,
    settings_updated_at,
  } = row;

  return {
    user_id,
    id: user_id,
    display_name,
    email,
    phone,
    dob,
    sex,
    timezone,
    created_at,
    updated_at,
    unit_glucose: unit_glucose ?? "mgdl",
    bg_target_min_mgdl,
    bg_target_max_mgdl,
    carb_ratio_g_per_u,
    insulin_sensitivity_mgdl_per_u,
    reminder_flags: (typeof reminder_flags === "string" ? JSON.parse(reminder_flags) : reminder_flags) ?? {},
    height_cm,
    weight_kg,
    waist_cm,
    goal,
    conditions: (typeof conditions === "string" ? JSON.parse(conditions) : conditions) ?? {},
    prefs: (typeof prefs === "string" ? JSON.parse(prefs) : prefs) ?? {},
    settings_created_at,
    settings_updated_at,
  };
}

function splitUpdates(updates: Partial<Profile>) {
  const appUser: Record<string, any> = {};
  const userSettings: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    if (APP_USER_FIELDS.has(key as keyof Profile)) {
      if (key === "id") {
        appUser["user_id"] = value;
      } else {
        appUser[key] = value;
      }
    } else if (USER_SETTINGS_FIELDS.has(key as keyof Profile)) {
      if (key === "conditions" || key === "prefs" || key === "reminder_flags") {
        userSettings[key] = value ?? {};
      } else {
        userSettings[key] = value;
      }
    }
  }

  return { appUser, userSettings };
}

async function ensureUserSettingsRow(userId: string) {
  await query(
    `INSERT INTO user_settings (user_id, created_at, updated_at)
     VALUES ($1, now(), now())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

export class ProfilesRepo {
  async create(profile: Partial<Profile>): Promise<Profile> {
    const { appUser, userSettings } = splitUpdates(profile);
    const userId =
      appUser.user_id ??
      profile.user_id ??
      profile.id;

    if (!userId) {
      throw new Error("Profile payload requires user_id");
    }

    if (!appUser.user_id) {
      appUser.user_id = userId;
    }

    const appColumns = Object.keys(appUser).filter((key) => key !== "id");
    const appValues = appColumns.map((key) => appUser[key]);
    if (appColumns.length > 0) {
      const placeholders = appColumns.map((_, idx) => `$${idx + 1}`).join(", ");
      const columnsSql = appColumns.join(", ");
      const updateAssignments = appColumns
        .filter((col) => col !== "user_id")
        .map((col) => `${col} = EXCLUDED.${col}`)
        .concat("updated_at = now()");
      await query(
        `INSERT INTO app_user (${columnsSql})
         VALUES (${placeholders})
         ON CONFLICT (user_id) DO UPDATE SET ${updateAssignments.join(", ")}`,
        appValues,
      );
    }

    await ensureUserSettingsRow(userId);

    const settingsColumns = Object.keys(userSettings);
    if (settingsColumns.length > 0) {
      const settingsValues = settingsColumns.map((key) => {
        const value = userSettings[key];
        if (value === null || value === undefined) return null;
        if (typeof value === "object" && !(value instanceof Date)) {
          return JSON.stringify(value);
        }
        return value;
      });
      const assignments = settingsColumns.map((col, idx) => `${col} = $${idx + 1}`);
      await query(
        `UPDATE user_settings
         SET ${assignments.join(", ")}, updated_at = now()
         WHERE user_id = $${settingsColumns.length + 1}`,
        [...settingsValues, userId],
      );
    }

    const created = await this.getById(userId);
    if (!created) throw new Error("Profile creation failed");
    return created;
  }

  async getById(userId: string): Promise<Profile | null> {
    const result = await query(
      `SELECT
         u.user_id,
         u.display_name,
         u.email,
         u.phone,
         u.dob,
         u.sex,
         u.timezone,
         u.created_at,
         u.updated_at,
         s.unit_glucose,
         s.bg_target_min_mgdl,
         s.bg_target_max_mgdl,
         s.carb_ratio_g_per_u,
         s.insulin_sensitivity_mgdl_per_u,
         s.reminder_flags,
         s.height_cm,
         s.weight_kg,
         s.waist_cm,
         s.goal,
         s.conditions,
         s.prefs,
         s.created_at AS settings_created_at,
         s.updated_at AS settings_updated_at
       FROM app_user u
       LEFT JOIN user_settings s ON s.user_id = u.user_id
       WHERE u.user_id = $1
       LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) return null;
    return mapRowToProfile(result.rows[0]);
  }

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { appUser, userSettings } = splitUpdates(updates);

    if (Object.keys(appUser).length === 0 && Object.keys(userSettings).length === 0) {
      const current = await this.getById(userId);
      if (!current) throw new Error("Profile not found");
      return current;
    }

    if (Object.keys(appUser).length > 0) {
      const columns = Object.keys(appUser).filter((key) => key !== "id");
      const values = columns.map((key) => appUser[key]);
      const assignments = columns.map((col, idx) => `${col} = $${idx + 1}`);
      await query(
        `UPDATE app_user
         SET ${assignments.join(", ")}, updated_at = now()
         WHERE user_id = $${columns.length + 1}`,
        [...values, userId],
      );
    }

    if (Object.keys(userSettings).length > 0) {
      await ensureUserSettingsRow(userId);
      const columns = Object.keys(userSettings);
      const values = columns.map((key) => {
        const value = userSettings[key];
        if (value === null || value === undefined) return null;
        if (typeof value === "object" && !(value instanceof Date)) {
          return JSON.stringify(value);
        }
        return value;
      });
      const assignments = columns.map((col, idx) => `${col} = $${idx + 1}`);
      await query(
        `UPDATE user_settings
         SET ${assignments.join(", ")}, updated_at = now()
         WHERE user_id = $${columns.length + 1}`,
        [...values, userId],
      );
    }

    const result = await this.getById(userId);
    if (!result) throw new Error("Profile not found");
    return result;
  }
}
