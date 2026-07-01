"use client";

import { useRouter } from "next/navigation";

interface DayData {
  date: string;
  mySpent: number;
  totalSpent: number;
  available: number | null;
  isToday: boolean;
  isFuture: boolean;
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
  return amount.toLocaleString("ko-KR") + "원";
}

export default function Calendar({ year, month, days, onPrev, onNext }: CalendarProps) {
  const router = useRouter();
  const firstDay = new Date(year, month - 1, 1).getDay();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          ←
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {year}년 {month}월
        </h2>
        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          →
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gray-50">
        {WEEK_LABELS.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {/* 첫째 날 전 빈 칸 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-t border-gray-50 min-h-[72px]" />
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
                border-t border-gray-100 min-h-[72px] p-1.5 text-left flex flex-col gap-0.5 transition-colors
                ${day.isToday ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : ""}
                ${day.isFuture ? "bg-gray-50 cursor-default opacity-50" : "hover:bg-gray-50 cursor-pointer"}
              `}
            >
              <span
                className={`text-xs font-semibold ${
                  isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-gray-700"
                } ${day.isToday ? "w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center" : ""}`}
              >
                {dayNum}
              </span>

              {!day.isFuture && day.mySpent > 0 && (
                <span className={`text-xs font-medium ${day.mySpent > 0 ? "text-rose-600" : "text-gray-400"}`}>
                  -{formatKRW(day.mySpent)}
                </span>
              )}

              {day.isToday && day.available !== null && (
                <span className="text-xs text-emerald-700 font-semibold">
                  ✓{formatKRW(day.available)}
                </span>
              )}

              {!day.isFuture && !day.isToday && day.totalSpent > day.mySpent && (
                <span className="text-xs text-gray-400">
                  전체 {formatKRW(day.totalSpent)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
