"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  userName: string;
  userRole: string;
}

export default function Header({ userName, userRole }: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "캘린더" },
    { href: "/goals", label: "목표" },
    { href: "/settings", label: "설정" },
    ...(userRole === "ADMIN" ? [{ href: "/admin/invites", label: "초대 관리" }] : []),
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-indigo-600 text-lg">
          💰 예산 수첩
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="sm:hidden flex border-t border-gray-100">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "text-indigo-600 border-t-2 border-indigo-600 -mt-px"
                : "text-gray-500"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
