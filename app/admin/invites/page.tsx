"use client";

import { useCallback, useEffect, useState } from "react";

interface Invite {
  id: string;
  token: string;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string };
  url?: string;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copied, setCopied] = useState(false);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/invites");
    if (res.ok) setInvites(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const createInvite = async () => {
    setCreating(true);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewInviteUrl(data.url);
      fetchInvites();
    }
    setCreating(false);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(newInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteInvite = async (id: string) => {
    if (!confirm("이 초대 링크를 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">초대 링크 관리</h1>

      {/* 초대 링크 생성 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">새 초대 링크 생성</h3>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 shrink-0">유효기간</label>
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value={1}>1일</option>
            <option value={3}>3일</option>
            <option value={7}>7일</option>
            <option value={30}>30일</option>
          </select>
        </div>

        <button
          onClick={createInvite}
          disabled={creating}
          className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[48px]"
        >
          {creating ? "생성 중..." : "초대 링크 생성"}
        </button>

        {newInviteUrl && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium">생성된 초대 링크 (1회용)</p>
            <p className="text-xs text-gray-700 break-all">{newInviteUrl}</p>
            <button
              onClick={copyUrl}
              className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              {copied ? "복사됨!" : "링크 복사"}
            </button>
          </div>
        )}
      </div>

      {/* 초대 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">초대 내역</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">초대 내역이 없습니다.</div>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => {
              const used = !!invite.usedAt;
              const expired = isExpired(invite.expiresAt);
              const status = used ? "사용됨" : expired ? "만료됨" : "유효";

              return (
                <li
                  key={invite.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          used
                            ? "bg-gray-100 text-gray-500"
                            : expired
                            ? "bg-red-50 text-red-500"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {invite.invitedBy.name} 생성
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      만료: {new Date(invite.expiresAt).toLocaleDateString("ko-KR")}
                      {invite.usedAt && ` · 사용: ${new Date(invite.usedAt).toLocaleDateString("ko-KR")}`}
                    </p>
                  </div>
                  {!used && (
                    <button
                      onClick={() => deleteInvite(invite.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
