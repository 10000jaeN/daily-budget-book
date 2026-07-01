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
  const [allBalances, setAllBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 세션 사용자 정보 fetch
  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((d) => setSessionUser(d)).catch(() => {});
  }, []);

  const fetchSpendings = useCallback(async () => {
    setLoading(true);
    const [spendRes, balanceRes] = await Promise.all([
      fetch(`/api/spending?date=${date}`, { cache: "no-store" }),
      fetch(`/api/balance?date=${date}&all=true`, { cache: "no-store" }),
    ]);
    if (spendRes.ok) setSpendings(await spendRes.json());
    if (balanceRes.ok) setAllBalances(await balanceRes.json());
    setLoading(false);
    router.refresh();
  }, [date, router]);

  useEffect(() => {
    fetchSpendings();
  }, [fetchSpendings]);

  const totalSpent = spendings.reduce((s, sp) => s + sp.amount, 0);
  const mySpent = spendings
    .filter((sp) => sp.user.id === sessionUser?.id)
    .reduce((s, sp) => s + sp.amount, 0);

  const [year, month, day] = date.split("-");
  const dateLabel = `${year}년 ${Number(month)}월 ${Number(day)}일`;

  const mySpendings = spendings.filter((sp) => sp.user.id === sessionUser?.id);
  const otherSpendings = spendings.filter((sp) => sp.user.id !== sessionUser?.id);

  // 유저별 항목별 잔액 계산 (시간 오름차순 → 차감)
  const spendingBalances: Record<string, number> = {};
  if (Object.keys(allBalances).length > 0) {
    // 유저별로 그룹화
    const byUser: Record<string, Spending[]> = {};
    for (const sp of spendings) {
      if (!byUser[sp.user.id]) byUser[sp.user.id] = [];
      byUser[sp.user.id].push(sp);
    }
    for (const [userId, userSpendings] of Object.entries(byUser)) {
      const endBalance = allBalances[userId] ?? 0;
      const totalSpentByUser = userSpendings.reduce((s, sp) => s + sp.amount, 0);
      const sorted = [...userSpendings].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      let running = endBalance + totalSpentByUser; // 지출 전 잔액
      for (const sp of sorted) {
        running -= sp.amount;
        spendingBalances[sp.id] = running;
      }
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors py-2 pr-3 -ml-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        돌아가기
      </button>

      <h2 className="text-xl font-bold text-gray-900">{dateLabel}</h2>

      {/* 지출 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">내 지출</p>
          <p className="text-xl font-bold text-rose-600">{mySpent.toLocaleString()}원</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">전체 지출</p>
          <p className="text-xl font-bold text-gray-800">{totalSpent.toLocaleString()}원</p>
        </div>
      </div>

      {/* 지출 추가 폼 */}
      <SpendingForm date={date} onSuccess={fetchSpendings} />

      {/* 지출 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="space-y-5">
          {/* 내 지출 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              내 지출 {mySpendings.length > 0 ? `(${mySpendings.length}건)` : ""}
            </h3>
            <SpendingList
              spendings={mySpendings}
              isAdmin={sessionUser?.role === "ADMIN"}
              onDelete={(id) => setSpendings((prev) => prev.filter((s) => s.id !== id))}
              balances={spendingBalances}
            />
          </div>

          {/* 다른 사람 지출 */}
          {otherSpendings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                다른 사람 지출 ({otherSpendings.length}건)
              </h3>
              <SpendingList
                spendings={otherSpendings}
                isAdmin={sessionUser?.role === "ADMIN"}
                onDelete={(id) => setSpendings((prev) => prev.filter((s) => s.id !== id))}
                balances={spendingBalances}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
