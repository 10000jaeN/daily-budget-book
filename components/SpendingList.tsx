"use client";

interface Spending {
  id: string;
  amount: number;
  memo: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface SpendingListProps {
  spendings: Spending[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export default function SpendingList({ spendings, isAdmin, onDelete }: SpendingListProps) {
  if (spendings.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        이날 지출 내역이 없습니다.
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("이 지출을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/spending/${id}`, { method: "DELETE" });
    if (res.ok) onDelete(id);
  };

  return (
    <ul className="space-y-2">
      {spendings.map((s) => (
        <li
          key={s.id}
          className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{s.memo}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {s.user.name} · {new Date(s.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-rose-600">
              -{s.amount.toLocaleString()}원
            </span>
            {isAdmin && (
              <button
                onClick={() => handleDelete(s.id)}
                className="text-gray-300 hover:text-red-500 transition-colors"
                aria-label="삭제"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
