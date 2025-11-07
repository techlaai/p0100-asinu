"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
      <div className="bg-white shadow-lg rounded-xl px-6 py-8 text-center max-w-sm">
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Đang chuyển hướng…</h1>
        <p className="text-sm text-gray-600">
          Liên kết đăng nhập không còn được hỗ trợ. Vui lòng đăng nhập bằng email hoặc số điện
          thoại trực tiếp trên Asinu.
        </p>
      </div>
    </div>
  );
}
