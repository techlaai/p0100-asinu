'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/http";

export default function DeleteAccountButton() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const onDelete = async () => {
    setLoading(true);
    setError('');
    try {

      if (confirmation.trim().toUpperCase() !== 'XOA') {
        setError("Vui lòng nhập 'XOA' để xác nhận.");
        return;
      }

      await apiFetch("/api/profile/delete", { method: "DELETE" });

      // Clear local state and redirect
      router.replace('/auth/login');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Xóa tài khoản lỗi. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <button className="px-4 py-2 rounded-2xl bg-red-600 text-white" onClick={() => setStep(2)}>
        Xóa tài khoản
      </button>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="text-sm">Xác nhận lần 1: Hành động này không thể hoàn tác.</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-2xl bg-gray-200" onClick={() => setStep(1)}>Huỷ</button>
          <button className="px-4 py-2 rounded-2xl bg-orange-600 text-white" onClick={() => setStep(3)}>Tiếp tục</button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Gõ chữ <strong>XOA</strong> để xác nhận xóa tài khoản:</p>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Nhập XOA để xác nhận"
          className="w-full px-3 py-2 border rounded-lg"
          disabled={loading}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-2xl bg-gray-200" onClick={() => { setStep(1); setConfirmation(''); setError(''); }}>Huỷ</button>
          <button
            disabled={loading || confirmation.trim().length === 0}
            className="px-4 py-2 rounded-2xl bg-red-700 text-white disabled:opacity-50"
            onClick={onDelete}
          >
            {loading ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
