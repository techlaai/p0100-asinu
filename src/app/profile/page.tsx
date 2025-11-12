// src/app/profile/page.tsx
import React from "react";
import AuthGate from "@/interfaces/ui/components/AuthGate";
import ProfileViewer from "@/components/profile/ProfileViewer";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { getSession } from "@/infrastructure/auth/session";

export const dynamic = "force-dynamic";

async function getProfileServer(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/profile/${userId}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to load profile");
  }
  return res.json();
}

export default async function ProfilePage() {
  const session = await getSession();
  let profile: any = null;

  if (session?.user_id) {
    try {
      profile = await getProfileServer(session.user_id);
    } catch (error) {
      console.warn("[profile] load failed", error);
    }
  }

  return (
    <AuthGate>
      <main className="p-4 space-y-6">
        <h1 className="text-xl font-semibold">Bệnh án online</h1>

        {profile ? (
          <>
            <ProfileViewer profile={profile} />
            <ProfileEditor profile={profile} />
          </>
        ) : (
          <div className="rounded-md border bg-white p-4 text-sm">
            Không tải được hồ sơ (hoặc chưa có). Vui lòng đăng nhập.
          </div>
        )}
      </main>
    </AuthGate>
  );
}
