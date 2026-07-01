"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 첫 번째 사용자 여부 확인
  useEffect(() => {
    fetch("/api/users/count")
      .then((r) => r.json())
      .then((d) => setIsFirstUser(d.count === 0))
      .catch(() => setIsFirstUser(false));
  }, []);

  const isInvalidInvite = !isFirstUser && !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidInvite) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push("/?registered=1");
    } else {
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  if (isFirstUser === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFirstUser ? "관리자 계정 생성" : "회원가입"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFirstUser
              ? "첫 번째 계정은 관리자로 자동 등록됩니다"
              : "초대 링크로 가입합니다"}
          </p>
        </div>

        {isFirstUser && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 text-sm text-indigo-700">
            아직 등록된 사용자가 없습니다. 첫 번째로 가입하면 <strong>관리자(ADMIN)</strong> 권한이 부여됩니다.
          </div>
        )}

        {isInvalidInvite ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-500">유효한 초대 링크가 필요합니다.</p>
            <p className="text-xs text-gray-400">관리자에게 초대 링크를 요청해주세요.</p>
            <Link href="/" className="block text-sm text-indigo-600 hover:underline">
              로그인 페이지로
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="8자 이상"
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "가입 중..." : isFirstUser ? "관리자로 가입하기" : "가입하기"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          이미 계정이 있으신가요?{" "}
          <Link href="/" className="text-indigo-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
