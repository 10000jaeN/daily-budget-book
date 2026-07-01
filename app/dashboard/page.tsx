"use client";

import { useEffect, useState, useCallback } from "react";
import Calendar from "@/components/Calendar";

interface DayData {
  date: string;
  mySpent: number;
  totalSpent: number;
  available: number | null;
  isToday: boolean;
  isFuture: boolean;
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setDays(data.days);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrev = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  // 오늘 데이터 요약
  const today = days.find((d) => d.isToday);
  const totalMonthSpent = days.reduce((s, d) => s + d.mySpent, 0);

  return (
    <div className="space-y-4">
      {/* 오늘 요약 카드 */}
      {today && (
        <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-sm">
          <p className="text-indigo-200 text-sm mb-1">오늘 사용 가능</p>
          <p className="text-3xl font-bold">
            {(today.available ?? 0).toLocaleString()}원
          </p>
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
        <Calendar
          year={year}
          month={month}
          days={days}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
