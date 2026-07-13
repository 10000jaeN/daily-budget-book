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

/**
 * 여러 사용자의 누적 잔액을 3개 쿼리로 일괄 계산
 * (사용자별 3쿼리 × N 대신 전체 3쿼리로 처리)
 */
export async function getCumulativeBalanceBatch(
  userIds: string[],
  targetDate: Date
): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const endOfTarget = new Date(target);
  endOfTarget.setHours(23, 59, 59, 999);

  // 쿼리 1: 전체 사용자 가입일 일괄 조회
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, createdAt: true },
  });

  // 쿼리 2: 예산 설정 단일 조회 (모든 사용자 공통)
  const budgetSettings = await prisma.budgetSetting.findMany({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "asc" },
  });

  if (budgetSettings.length === 0) {
    return Object.fromEntries(userIds.map((id) => [id, 0]));
  }

  // 쿼리 3: 전체 사용자 지출 합산을 groupBy로 일괄 조회
  const minCreatedAt = new Date(Math.min(...users.map((u) => u.createdAt.getTime())));
  minCreatedAt.setHours(0, 0, 0, 0);

  const spendingGroups = await prisma.spending.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      date: { gte: minCreatedAt, lte: endOfTarget },
    },
    _sum: { amount: true },
  });

  const spendingMap = Object.fromEntries(
    spendingGroups.map((g) => [g.userId, g._sum.amount ?? 0])
  );

  // 누적 예산은 사용자별 가입일 기준으로 순수 계산 (DB 없음)
  const result: Record<string, number> = {};
  for (const user of users) {
    const startDate = new Date(user.createdAt);
    startDate.setHours(0, 0, 0, 0);

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

    result[user.id] = Math.max(0, accumulatedBudget - (spendingMap[user.id] ?? 0));
  }

  return result;
}

function max(a: Date, b: Date) {
  return a > b ? a : b;
}

function min(a: Date, b: Date) {
  return a < b ? a : b;
}
