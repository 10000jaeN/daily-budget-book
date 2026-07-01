import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableBalance } from "@/lib/budget";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // 해당 월 전체 지출 (모든 사용자)
  const allSpendings = await prisma.spending.findMany({
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // 날짜별 집계
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const days = await Promise.all(
    Array.from({ length: daysInMonth }, async (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayDate = new Date(year, month - 1, dayNum);

      const daySpendingsAll = allSpendings.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === dayNum;
      });

      const mySpent = daySpendingsAll
        .filter((s) => s.user.id === session.user.id)
        .reduce((sum, s) => sum + s.amount, 0);

      const totalSpent = daySpendingsAll.reduce((sum, s) => sum + s.amount, 0);

      // 오늘 또는 미래: 사용 가능 잔액 계산
      const isToday =
        dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getDate() === today.getDate();

      const isFuture = dayDate > today;

      let available: number | null = null;
      if (isToday) {
        available = await getAvailableBalance(session.user.id, today);
      }

      return {
        date: dateStr,
        mySpent,
        totalSpent,
        available,
        isToday,
        isFuture,
        spendings: daySpendingsAll,
      };
    })
  );

  return NextResponse.json({ year, month, days });
}
