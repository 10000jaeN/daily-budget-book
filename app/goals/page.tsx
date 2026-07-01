"use client";

import { useCallback, useEffect, useState } from "react";
import GoalCard from "@/components/GoalCard";

interface SavingGoal {
  id: string;
  title: string;
  amount: number;
  achievedAt: string | null;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setGoals(data.goals);
      setCurrentBalance(data.currentBalance);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: Number(amount) }),
    });

    if (res.ok) {
      setTitle("");
      setAmount("");
      fetchGoals();
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setSubmitting(false);
  };

  const activeGoals = goals.filter((g) => !g.achievedAt);
  const achievedGoals = goals.filter((g) => !!g.achievedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">목표 금액</h1>
      </div>

      {/* 현재 잔액 */}
      <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-sm">
        <p className="text-indigo-200 text-sm mb-1">현재 누적 잔액</p>
        <p className="text-3xl font-bold">{currentBalance.toLocaleString()}원</p>
        <p className="text-indigo-200 text-xs mt-1">
          지금까지 아낀 금액이에요
        </p>
      </div>

      {/* 목표 추가 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">새 목표 추가</h3>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="목표 이름 (예: 여행 경비)"
          required
          maxLength={50}
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="목표 금액"
            min="1"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !title || !amount}
          className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {submitting ? "추가 중..." : "목표 추가"}
        </button>
      </form>

      {/* 진행 중 목표 */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600">진행 중 ({activeGoals.length})</h3>
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currentBalance={currentBalance}
              onDelete={(id) => setGoals((prev) => prev.filter((g) => g.id !== id))}
            />
          ))}
        </div>
      )}

      {/* 달성한 목표 */}
      {achievedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600">달성 완료 ({achievedGoals.length})</h3>
          {achievedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currentBalance={currentBalance}
              onDelete={(id) => setGoals((prev) => prev.filter((g) => g.id !== id))}
            />
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          아직 설정한 목표가 없어요.<br />첫 번째 목표를 추가해보세요!
        </div>
      )}
    </div>
  );
}
