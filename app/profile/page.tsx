"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((d) => setName(d.name ?? ""));
  }, []);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameMsg("");
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setNameMsg(res.ok ? "이름이 변경되었습니다." : (data.error ?? "오류 발생"));
    setNameLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwLoading(true);
    setPwMsg("");
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
    } else {
      setPwMsg(data.error ?? "오류 발생");
    }
    setPwLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">내 정보 수정</h1>
      </div>

      {/* 이름 변경 */}
      <form onSubmit={handleNameUpdate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">이름 변경</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={20}
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="이름"
        />
        {nameMsg && (
          <p className={`text-sm ${nameMsg.includes("변경") ? "text-emerald-600" : "text-red-500"}`}>
            {nameMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={nameLoading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {nameLoading ? "변경 중..." : "이름 변경"}
        </button>
      </form>

      {/* 비밀번호 변경 */}
      <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">비밀번호 변경</h3>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="현재 비밀번호"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="새 비밀번호 (8자 이상)"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="새 비밀번호 확인"
        />
        {pwMsg && (
          <p className={`text-sm ${pwMsg.includes("변경") ? "text-emerald-600" : "text-red-500"}`}>
            {pwMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={pwLoading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {pwLoading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      {/* 로그아웃 */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full bg-gray-100 text-gray-600 rounded-xl py-3.5 text-base font-medium hover:bg-gray-200 transition-colors min-h-[48px]"
      >
        로그아웃
      </button>
    </div>
  );
}
