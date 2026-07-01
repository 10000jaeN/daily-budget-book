"use client";

interface SavingGoal {
  id: string;
  title: string;
  amount: number;
  achievedAt: string | null;
  createdAt: string;
}

interface GoalCardProps {
  goal: SavingGoal;
  currentBalance: number;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, currentBalance, onDelete }: GoalCardProps) {
  const progress = Math.min((currentBalance / goal.amount) * 100, 100);
  const isAchieved = !!goal.achievedAt;
  const remaining = Math.max(goal.amount - currentBalance, 0);

  const handleDelete = async () => {
    if (!confirm(`"${goal.title}" 목표를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    if (res.ok) onDelete(goal.id);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${isAchieved ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100"}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800">{goal.title}</p>
            {isAchieved && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                달성!
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            목표: {goal.amount.toLocaleString()}원
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
          aria-label="목표 삭제"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 프로그레스 바 */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{currentBalance.toLocaleString()}원</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAchieved ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {!isAchieved && (
          <p className="text-xs text-gray-400 mt-1">
            {remaining.toLocaleString()}원 더 모으면 달성
          </p>
        )}
        {isAchieved && (
          <p className="text-xs text-emerald-600 mt-1">
            {new Date(goal.achievedAt!).toLocaleDateString("ko-KR")} 달성 🎉
          </p>
        )}
      </div>
    </div>
  );
}
