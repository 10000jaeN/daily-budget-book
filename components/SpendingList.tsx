"use client";

import { memo, useCallback } from "react";

interface Spending {
  id: string;
  amount: number;
  memo: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface SpendingItemProps {
  spending: Spending;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  balance?: number;
}

const SpendingItem = memo(function SpendingItem({ spending: s, isAdmin, onDelete, balance }: SpendingItemProps) {
  const handleDelete = useCallback(async () => {
    if (!confirm("이 지출을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/spending/${s.id}`, { method: "DELETE" });
    if (res.ok) onDelete(s.id);
  }, [s.id, onDelete]);

  return (
    <li className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-800 truncate">{s.memo}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          {s.user.name} · {new Date(s.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <div className="text-right">
          <span className="text-base font-bold text-rose-600 block">
            -{s.amount.toLocaleString()}원
          </span>
          {balance !== undefined && (
            <span className="text-xs text-gray-400">
              잔액 {balance.toLocaleString()}원
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="삭제"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
});

interface SpendingListProps {
  spendings: Spending[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  balances?: Record<string, number>;
}

const SpendingList = memo(function SpendingList({ spendings, isAdmin, onDelete, balances }: SpendingListProps) {
  if (spendings.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        이날 지출 내역이 없습니다.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {spendings.map((s) => (
        <SpendingItem
          key={s.id}
          spending={s}
          isAdmin={isAdmin}
          onDelete={onDelete}
          balance={balances?.[s.id]}
        />
      ))}
    </ul>
  );
});

export default SpendingList;
