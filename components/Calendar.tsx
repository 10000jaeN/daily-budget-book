"use client";

import { useRouter } from "next/navigation";

interface DayData {
  date: string;
  mySpent: number;
  totalSpent: number;
  available: number | null;
  isToday: boolean;
  isFuture: boolean;
  userSpendings: { name: string; amount: number }[];
}

interface CalendarProps {
  year: number;
  month: number;
  days: DayData[];
  onPrev: () => void;
  onNext: () => void;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const USER_COLORS = [
  { chip: "bg-rose-400",    text: "text-rose-500" },
  { chip: "bg-blue-400",    text: "text-blue-500" },
  { chip: "bg-emerald-400", text: "text-emerald-500" },
  { chip: "bg-amber-400",   text: "text-amber-500" },
  { chip: "bg-purple-400",  text: "text-purple-500" },
];

function formatKRW(amount: number) {
  if (amount >= 10000) return (amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1) + "만";
  return amount.toLocaleString("ko-KR");
}

export default function Calendar({ year, month, days, onPrev, onNext }: CalendarProps) {
  const router = useRouter();
  const firstDay = new Date(year, month - 1, 1).getDay();

  // 이번 달에 등장하는 유저 목록 (첫 등장 순서로 색상 배정)
  const userColorMap: Record<string, number> = {};
  for (const day of days) {
    for (const u of day.userSpendings) {
      if (!(u.name in userColorMap)) {
        userColorMap[u.name] = Object.keys(userColorMap).length % USER_COLORS.length;
      }
    }
  }
  const legend = Object.entries(userColorMap);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={onPrev}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600 text-lg"
        >
          ‹
        </button>
        <h2 className="text-base font-bold text-gray-800">
          {year}년 {month}월
        </h2>
        <button
          onClick={onNext}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600 text-lg"
        >
          ›
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gray-50">
        {WEEK_LABELS.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-t border-gray-50 min-h-[60px]" />
        ))}

        {days.map((day, i) => {
          const dayNum = i + 1;
          const weekday = (firstDay + i) % 7;
          const isSunday = weekday === 0;
          const isSaturday = weekday === 6;

          return (
            <button
              key={day.date}
              onClick={() => !day.isFuture && router.push(`/dashboard/${day.date}`)}
              disabled={day.isFuture}
              className={`
                border-t border-gray-100 min-h-[60px] p-1.5 text-left flex flex-col gap-0.5 transition-colors active:bg-gray-100
                ${day.isToday ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : ""}
                ${day.isFuture ? "bg-gray-50 cursor-default opacity-40" : "hover:bg-gray-50 cursor-pointer"}
              `}
            >
              <span
                className={`text-xs font-bold leading-none ${
                  isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-gray-700"
                }`}
              >
                {day.isToday ? (
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">
                    {dayNum}
                  </span>
                ) : dayNum}
              </span>

              {!day.isFuture && day.userSpendings.map((u) => {
                const colorIdx = userColorMap[u.name] ?? 0;
                const color = USER_COLORS[colorIdx];
                return (
                  <span key={u.name} className={`flex items-center gap-0.5 leading-tight`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.chip}`} />
                    <span className={`text-[10px] font-medium ${color.text}`}>
                      {formatKRW(u.amount)}
                    </span>
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>

      {/* 유저 범례 */}
      {legend.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map(([name, colorIdx]) => (
            <span key={name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${USER_COLORS[colorIdx].chip}`} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
