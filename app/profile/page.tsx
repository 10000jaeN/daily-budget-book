"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#f43f5e", "#64748b",
];

export default function ProfilePage() {
  const router = useRouter();
  const [savedName, setSavedName] = useState("");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [savedColor, setSavedColor] = useState("#6366f1");
  const [colorChip, setColorChip] = useState("#6366f1");
  const [colorMsg, setColorMsg] = useState("");
  const [colorLoading, setColorLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((d) => {
      setSavedName(d.name ?? "");
      setName(d.name ?? "");
      const c = d.colorChip ?? "#6366f1";
      setSavedColor(c);
      setColorChip(c);
    });
  }, []);

  const handleColorUpdate = async () => {
    setColorLoading(true);
    setColorMsg("");
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colorChip }),
    });
    if (res.ok) {
      setSavedColor(colorChip);
      setColorMsg("저장되었습니다.");
      setTimeout(() => setColorMsg(""), 2000);
    } else {
      setColorMsg("저장 실패");
    }
    setColorLoading(false);
  };

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
    if (res.ok) setSavedName(name);
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

      {/* 캘린더 컬러칩 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">캘린더 컬러</h3>
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colorChip }} />
        </div>
        <p className="text-xs text-gray-400">캘린더에 표시되는 내 지출의 색상입니다.</p>
        <div className="grid grid-cols-6 gap-3">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorChip(c)}
              className="w-10 h-10 rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{
                backgroundColor: c,
                outline: colorChip === c ? `3px solid ${c}` : undefined,
                outlineOffset: colorChip === c ? "3px" : undefined,
              }}
            />
          ))}
        </div>
        {colorMsg && (
          <p className={`text-sm ${colorMsg.includes("저장되었") ? "text-emerald-600" : "text-red-500"}`}>
            {colorMsg}
          </p>
        )}
        <button
          type="button"
          onClick={handleColorUpdate}
          disabled={colorLoading || colorChip === savedColor}
          className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {colorLoading ? "저장 중..." : "컬러 변경"}
        </button>
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
          disabled={nameLoading || name.trim() === savedName}
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
