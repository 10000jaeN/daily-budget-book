"use client";

import { useState } from "react";

interface SpendingFormProps {
  date: string;
  onSuccess: () => void;
}

export default function SpendingForm({ date, onSuccess }: SpendingFormProps) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !memo) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/spending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), memo, date }),
    });

    if (res.ok) {
      setAmount("");
      setMemo("");
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h3 className="font-semibold text-gray-800">지출 추가</h3>

      {/* 모바일: 세로 배치 */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="금액"
            min="1"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
        </div>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (예: 편의점)"
          required
          maxLength={100}
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !amount || !memo}
        className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors min-h-[48px]"
      >
        {loading ? "추가 중..." : "지출 추가"}
      </button>
    </form>
  );
}
