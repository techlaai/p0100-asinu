// src/app/profile/page.tsx
import React from "react";
import AuthGate from "@/interfaces/ui/components/AuthGate";
import ProfileViewer from "@/components/profile/ProfileViewer";
import ProfileEditor from "@/components/profile/ProfileEditor";

export const dynamic = "force-dynamic";

async function getProfileServer(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/profile/${userId}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export default async function ProfilePage() {
  // TODO: thay bằng cách lấy userId thực tế từ hệ thống nhận diện của bạn
  const userId = "REPLACE_WITH_AUTH_UID";
  let profile: any = null;
  try { profile = await getProfileServer(userId); } catch {}

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
