"use client";

import { useState } from "react";

interface Vote {
  userId: string;
  approved: boolean;
  user: { id: string; name: string };
}

interface BudgetChangeRequest {
  id: string;
  budgetSetting: { amount: number; effectiveFrom: string };
  requestedBy: { id: string; name: string };
  votes: Vote[];
}

interface BudgetVoteCardProps {
  request: BudgetChangeRequest;
  totalUsers: number;
  users: { id: string; name: string }[];
  currentUserId: string;
  onVoted: () => void;
}

export default function BudgetVoteCard({
  request,
  totalUsers,
  users,
  currentUserId,
  onVoted,
}: BudgetVoteCardProps) {
  const [loading, setLoading] = useState(false);

  const myVote = request.votes.find((v) => v.userId === currentUserId);
  const approvedCount = request.votes.filter((v) => v.approved).length;
  const rejectedCount = request.votes.filter((v) => !v.approved).length;
  const effectiveDate = new Date(request.budgetSetting.effectiveFrom).toLocaleDateString("ko-KR");

  const vote = async (approved: boolean) => {
    setLoading(true);
    await fetch("/api/budget/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id, approved }),
    });
    onVoted();
    setLoading(false);
  };

  const votedUserIds = new Set(request.votes.map((v) => v.userId));

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">투표 진행 중</p>
        <p className="text-lg font-bold text-gray-800">
          {request.budgetSetting.amount.toLocaleString()}원
        </p>
        <p className="text-sm text-gray-500">{effectiveDate}부터 적용 · {request.requestedBy.name} 제안</p>
      </div>

      {/* 투표 현황 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">투표 현황 ({request.votes.length}/{totalUsers})</p>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const userVote = request.votes.find((v) => v.userId === u.id);
            return (
              <span
                key={u.id}
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  !votedUserIds.has(u.id)
                    ? "bg-gray-100 text-gray-500"
                    : userVote?.approved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {u.name} {!votedUserIds.has(u.id) ? "" : userVote?.approved ? "✓" : "✗"}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          찬성 {approvedCount} · 반대 {rejectedCount} · 미투표 {totalUsers - request.votes.length}
        </p>
      </div>

      {/* 투표 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => vote(true)}
          disabled={loading}
          className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors min-h-[48px] active:scale-95 ${
            myVote?.approved === true
              ? "bg-emerald-600 text-white"
              : "bg-white border border-emerald-400 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          👍 찬성
        </button>
        <button
          onClick={() => vote(false)}
          disabled={loading}
          className={`flex-1 py-3.5 rounded-xl text-base font-semibold transition-colors min-h-[48px] active:scale-95 ${
            myVote?.approved === false
              ? "bg-red-600 text-white"
              : "bg-white border border-red-300 text-red-600 hover:bg-red-50"
          }`}
        >
          👎 반대
        </button>
      </div>
    </div>
  );
}
