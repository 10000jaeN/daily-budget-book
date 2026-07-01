"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SpendingForm from "@/components/SpendingForm";
import SpendingList from "@/components/SpendingList";

interface Spending {
  id: string;
  amount: number;
  memo: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface SessionUser {
  id: string;
  role: string;
}

export default function DateDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const [spendings, setSpendings] = useState<Spending[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 세션 사용자 정보 fetch
  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((d) => setSessionUser(d)).catch(() => {});
  }, []);

  const fetchSpendings = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/spending?date=${date}`);
    if (res.ok) setSpendings(await res.json());
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchSpendings();
  }, [fetchSpendings]);

  const totalSpent = spendings.reduce((s, sp) => s + sp.amount, 0);
  const mySpent = spendings
    .filter((sp) => sp.user.id === sessionUser?.id)
    .reduce((s, sp) => s + sp.amount, 0);

  const [year, month, day] = date.split("-");
  const dateLabel = `${year}년 ${Number(month)}월 ${Number(day)}일`;

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← 돌아가기
      </button>

      <div>
        <h2 className="text-xl font-bold text-gray-900">{dateLabel}</h2>
      </div>

      {/* 지출 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">내 지출</p>
          <p className="text-lg font-bold text-rose-600">{mySpent.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">전체 지출</p>
          <p className="text-lg font-bold text-gray-800">{totalSpent.toLocaleString()}원</p>
        </div>
      </div>

      {/* 지출 추가 폼 */}
      <SpendingForm date={date} onSuccess={fetchSpendings} />

      {/* 지출 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">
          지출 내역 {spendings.length > 0 ? `(${spendings.length}건)` : ""}
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
        ) : (
          <SpendingList
            spendings={spendings}
            isAdmin={sessionUser?.role === "ADMIN"}
            onDelete={(id) => setSpendings((prev) => prev.filter((s) => s.id !== id))}
          />
        )}
      </div>
    </div>
  );
}
