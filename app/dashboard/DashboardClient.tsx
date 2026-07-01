"use client";

import { useState, useCallback } from "react";
import Calendar from "@/components/Calendar";
import { DayData } from "@/lib/calendarData";

interface DashboardClientProps {
  initialYear: number;
  initialMonth: number;
  initialDays: DayData[];
}

export default function DashboardClient({ initialYear, initialMonth, initialDays }: DashboardClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState<DayData[]>(initialDays);
  const [loading, setLoading] = useState(false);

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${y}&month=${m}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDays(data.days);
    }
    setLoading(false);
  }, []);

  const handlePrev = () => {
    const newYear = month === 1 ? year - 1 : year;
    const newMonth = month === 1 ? 12 : month - 1;
    setYear(newYear);
    setMonth(newMonth);
    fetchCalendar(newYear, newMonth);
  };

  const handleNext = () => {
    const newYear = month === 12 ? year + 1 : year;
    const newMonth = month === 12 ? 1 : month + 1;
    setYear(newYear);
    setMonth(newMonth);
    fetchCalendar(newYear, newMonth);
  };

  const today = days.find((d) => d.isToday);
  const totalMonthSpent = days.reduce((s, d) => s + d.mySpent, 0);

  return (
    <div className="space-y-4">
      {today && (
        <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-indigo-200 text-sm mb-1">오늘 사용 가능</p>
          <p className="text-3xl font-bold">{(today.available ?? 0).toLocaleString()}원</p>
          <div className="flex gap-4 mt-3 text-sm text-indigo-200">
            <span>오늘 지출 {today.mySpent.toLocaleString()}원</span>
            <span>·</span>
            <span>이번 달 {totalMonthSpent.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          불러오는 중...
        </div>
      ) : (
        <Calendar year={year} month={month} days={days} onPrev={handlePrev} onNext={handleNext} />
      )}
    </div>
  );
}
