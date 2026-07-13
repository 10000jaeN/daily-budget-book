import { prisma } from "@/lib/prisma";
import { getCumulativeBalance } from "@/lib/budget";

export interface DayData {
  date: string;
  mySpent: number;
  totalSpent: number;
  available: number | null;
  isToday: boolean;
  isFuture: boolean;
  userSpendings: { name: string; amount: number; color: string }[];
}

export async function getCalendarData(userId: string, year: number, month: number): Promise<DayData[]> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const allSpendings = await prisma.spending.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    include: { user: { select: { id: true, name: true, colorChip: true } } },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  return Promise.all(
    Array.from({ length: daysInMonth }, async (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayDate = new Date(year, month - 1, dayNum);

      const daySpendings = allSpendings.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === dayNum;
      });

      const mySpent = daySpendings.filter((s) => s.user.id === userId).reduce((sum, s) => sum + s.amount, 0);
      const totalSpent = daySpendings.reduce((sum, s) => sum + s.amount, 0);

      const isToday =
        dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getDate() === today.getDate();
      const isFuture = dayDate > today;

      const available = isToday ? await getCumulativeBalance(userId, today) : null;

      const userSpentMap: Record<string, { name: string; amount: number; color: string }> = {};
      for (const s of daySpendings) {
        if (!userSpentMap[s.user.id]) userSpentMap[s.user.id] = { name: s.user.name, amount: 0, color: s.user.colorChip };
        userSpentMap[s.user.id].amount += s.amount;
      }

      return { date: dateStr, mySpent, totalSpent, available, isToday, isFuture, userSpendings: Object.values(userSpentMap) };
    })
  );
}
