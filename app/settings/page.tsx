"use client";

import { useCallback, useEffect, useState } from "react";
import BudgetVoteCard from "@/components/BudgetVoteCard";

interface BudgetSetting {
  id: string;
  amount: number;
  effectiveFrom: string;
  status: string;
}

interface BudgetChangeRequest {
  id: string;
  budgetSetting: { amount: number; effectiveFrom: string };
  requestedBy: { id: string; name: string };
  votes: { userId: string; approved: boolean; user: { id: string; name: string } }[];
}

interface BudgetData {
  active: BudgetSetting | null;
  pending: BudgetChangeRequest | null;
  totalUsers: number;
  users: { id: string; name: string }[];
}

interface Me {
  id: string;
  role: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function SettingsPage() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notifSubscribed, setNotifSubscribed] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [budgetRes, meRes] = await Promise.all([
      fetch("/api/budget"),
      fetch("/api/users/me"),
    ]);
    if (budgetRes.ok) setBudgetData(await budgetRes.json());
    if (meRes.ok) setMe(await meRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => setNotifSubscribed(!!sub));
    });
  }, []);

  const handleNotifToggle = async () => {
    setNotifLoading(true);
    try {
      if (notifSubscribed) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await fetch("/api/push/subscribe", { method: "DELETE" });
        setNotifSubscribed(false);
      } else {
        let permission = notifPermission as NotificationPermission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
          setNotifPermission(permission);
        }
        if (permission !== "granted") return;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        setNotifSubscribed(true);
      }
    } finally {
      setNotifLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/budget/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(newAmount), effectiveFrom }),
    });

    if (res.ok) {
      setNewAmount("");
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setSubmitting(false);
  };

  if (!budgetData || !me) {
    return <div className="text-center py-16 text-gray-400">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">설정</h1>

      {/* 알림 설정 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">알림 설정</h3>
        {notifPermission === "unsupported" ? (
          <p className="text-sm text-gray-400">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
        ) : notifPermission === "denied" ? (
          <p className="text-sm text-gray-400">브라우저 설정에서 알림 권한을 허용해주세요.</p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">지출 등록 알림</p>
              <p className="text-xs text-gray-400 mt-0.5">다른 멤버가 지출을 등록하면 알림을 받습니다.</p>
            </div>
            <button
              onClick={handleNotifToggle}
              disabled={notifLoading}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                notifSubscribed ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  notifSubscribed ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold text-gray-900">예산 설정</h2>

      {/* 현재 예산 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-1">현재 일별 한도</p>
        {budgetData.active ? (
          <>
            <p className="text-3xl font-bold text-indigo-600">
              {budgetData.active.amount.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(budgetData.active.effectiveFrom).toLocaleDateString("ko-KR")}부터 적용
            </p>
          </>
        ) : (
          <p className="text-gray-400 text-sm">설정된 예산이 없습니다.</p>
        )}
      </div>

      {/* 진행 중 투표 */}
      {budgetData.pending && (
        <BudgetVoteCard
          request={budgetData.pending}
          totalUsers={budgetData.totalUsers}
          users={budgetData.users}
          currentUserId={me.id}
          onVoted={fetchData}
        />
      )}

      {/* 변경 요청 폼 */}
      {!budgetData.pending && (
        <form onSubmit={handleRequest} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">예산 변경 요청</h3>
          <p className="text-xs text-gray-500">
            변경 요청 후 모든 사용자가 찬성해야 적용됩니다.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">새 일별 한도</label>
            <div className="relative">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="금액 입력"
                min="1"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">적용 시작일</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !newAmount}
            className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
          >
            {submitting ? "요청 중..." : "변경 요청 보내기"}
          </button>
        </form>
      )}
    </div>
  );
}
