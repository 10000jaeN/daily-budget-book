"use client";

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

interface DateDetailClientProps {
  date: string;
  spendings: Spending[];
  allBalances: Record<string, number>;
  sessionUserId: string;
  isAdmin: boolean;
}

export default function DateDetailClient({ date, spendings, allBalances, sessionUserId, isAdmin }: DateDetailClientProps) {
  const router = useRouter();

  const mySpent = spendings.filter((sp) => sp.user.id === sessionUserId).reduce((s, sp) => s + sp.amount, 0);
  const totalSpent = spendings.reduce((s, sp) => s + sp.amount, 0);
  const mySpendings = spendings.filter((sp) => sp.user.id === sessionUserId);
  const otherSpendings = spendings.filter((sp) => sp.user.id !== sessionUserId);

  // 유저별 항목별 잔액 계산
  const spendingBalances: Record<string, number> = {};
  if (Object.keys(allBalances).length > 0) {
    const byUser: Record<string, Spending[]> = {};
    for (const sp of spendings) {
      if (!byUser[sp.user.id]) byUser[sp.user.id] = [];
      byUser[sp.user.id].push(sp);
    }
    for (const [userId, userSpendings] of Object.entries(byUser)) {
      const endBalance = allBalances[userId] ?? 0;
      const totalSpentByUser = userSpendings.reduce((s, sp) => s + sp.amount, 0);
      const sorted = [...userSpendings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      let running = endBalance + totalSpentByUser;
      for (const sp of sorted) {
        running -= sp.amount;
        spendingBalances[sp.id] = running;
      }
    }
  }

  const [year, month, day] = date.split("-");
  const dateLabel = `${year}년 ${Number(month)}월 ${Number(day)}일`;

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

      <SpendingForm date={date} onSuccess={() => router.refresh()} />

      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            내 지출 {mySpendings.length > 0 ? `(${mySpendings.length}건)` : ""}
          </h3>
          <SpendingList
            spendings={mySpendings}
            isAdmin={isAdmin}
            onDelete={() => router.refresh()}
            balances={spendingBalances}
          />
        </div>

        {otherSpendings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              다른 사람 지출 ({otherSpendings.length}건)
            </h3>
            <SpendingList
              spendings={otherSpendings}
              isAdmin={isAdmin}
              onDelete={() => router.refresh()}
              balances={spendingBalances}
            />
          </div>
        )}
      </div>
    </div>
  );
}
