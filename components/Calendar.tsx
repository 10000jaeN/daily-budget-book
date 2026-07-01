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

function formatKRW(amount: number) {
  if (amount >= 10000) return (amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1) + "만";
  return amount.toLocaleString("ko-KR");
}

export default function Calendar({ year, month, days, onPrev, onNext }: CalendarProps) {
  const router = useRouter();
  const firstDay = new Date(year, month - 1, 1).getDay();

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

              {!day.isFuture && day.userSpendings.map((u) => (
                <span key={u.name} className="text-[10px] text-gray-500 leading-tight block truncate">
                  {u.name}:{formatKRW(u.amount)}
                </span>
              ))}

            </button>
          );
        })}
      </div>
    </div>
  );
}
