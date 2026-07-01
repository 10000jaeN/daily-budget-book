import { prisma } from "@/lib/prisma";

/**
 * 특정 사용자의 특정 날짜 기준 사용 가능 금액 계산
 * 사용 가능 금액 = 가입일부터 오늘까지 누적 예산 - 어제까지 총 지출
 */
export async function getAvailableBalance(
  userId: string,
  targetDate: Date
): Promise<number> {
  // 사용자 가입일
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return 0;

  const startDate = new Date(user.createdAt);
  startDate.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // 적용된 예산 설정 목록 (ACTIVE, effectiveFrom 오름차순)
  const budgetSettings = await prisma.budgetSetting.findMany({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "asc" },
  });

  if (budgetSettings.length === 0) return 0;

  // 누적 예산 계산 (구간별 한도 × 일수)
  let accumulatedBudget = 0;
  for (let i = 0; i < budgetSettings.length; i++) {
    const setting = budgetSettings[i];
    const settingStart = new Date(setting.effectiveFrom);
    settingStart.setHours(0, 0, 0, 0);

    const segmentStart = max(startDate, settingStart);
    const segmentEnd =
      i + 1 < budgetSettings.length
        ? new Date(budgetSettings[i + 1].effectiveFrom)
        : new Date(target.getTime() + 24 * 60 * 60 * 1000); // target + 1일

    const segmentEndNorm = new Date(segmentEnd);
    segmentEndNorm.setHours(0, 0, 0, 0);

    const clampedEnd = min(segmentEndNorm, new Date(target.getTime() + 24 * 60 * 60 * 1000));

    if (segmentStart >= clampedEnd) continue;

    const days = Math.round(
      (clampedEnd.getTime() - segmentStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    accumulatedBudget += days * setting.amount;
  }

  // 어제까지의 총 지출 (하루 끝 23:59:59까지 포함)
  const yesterday = new Date(target);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const totalSpent = await prisma.spending.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: yesterday,
      },
    },
    _sum: { amount: true },
  });

  const spent = totalSpent._sum.amount ?? 0;
  return Math.max(0, accumulatedBudget - spent);
}

/**
 * 오늘까지 포함한 누적 잔액 (목표 달성 체크용)
 */
export async function getCumulativeBalance(
  userId: string,
  targetDate: Date
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return 0;

  const startDate = new Date(user.createdAt);
  startDate.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const budgetSettings = await prisma.budgetSetting.findMany({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "asc" },
  });

  if (budgetSettings.length === 0) return 0;

  let accumulatedBudget = 0;
  for (let i = 0; i < budgetSettings.length; i++) {
    const setting = budgetSettings[i];
    const settingStart = new Date(setting.effectiveFrom);
    settingStart.setHours(0, 0, 0, 0);

    const segmentStart = max(startDate, settingStart);
    const segmentEnd =
      i + 1 < budgetSettings.length
        ? new Date(budgetSettings[i + 1].effectiveFrom)
        : new Date(target.getTime() + 24 * 60 * 60 * 1000);

    const segmentEndNorm = new Date(segmentEnd);
    segmentEndNorm.setHours(0, 0, 0, 0);

    const clampedEnd = min(segmentEndNorm, new Date(target.getTime() + 24 * 60 * 60 * 1000));
    if (segmentStart >= clampedEnd) continue;

    const days = Math.round(
      (clampedEnd.getTime() - segmentStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    accumulatedBudget += days * setting.amount;
  }

  const endOfTarget = new Date(target);
  endOfTarget.setHours(23, 59, 59, 999);

  const totalSpent = await prisma.spending.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endOfTarget,
      },
    },
    _sum: { amount: true },
  });

  const spent = totalSpent._sum.amount ?? 0;
  return Math.max(0, accumulatedBudget - spent);
}

function max(a: Date, b: Date) {
  return a > b ? a : b;
}

function min(a: Date, b: Date) {
  return a < b ? a : b;
}
