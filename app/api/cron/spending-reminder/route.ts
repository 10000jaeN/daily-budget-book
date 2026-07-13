import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 현재 KST 날짜 계산 (UTC+9)
  const nowUTC = new Date();
  const kstNow = new Date(nowUTC.getTime() + 9 * 60 * 60 * 1000);
  const kstDateStr = kstNow.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // 2일 전 날짜 (이 날짜 이하면 알림 대상)
  const thresholdKST = new Date(kstNow.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threshold = new Date(`${thresholdKST.toISOString().slice(0, 10)}T00:00:00.000Z`);

  // 푸시 구독이 있는 유저 + 가장 최근 지출일 조회
  const users = await prisma.user.findMany({
    where: { pushSubscription: { isNot: null } },
    select: {
      id: true,
      name: true,
      spendings: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });

  const isTest = req.nextUrl.searchParams.get("test") === "true";
  const results: { userId: string; sent: boolean }[] = [];

  for (const user of users) {
    const lastSpending = user.spendings[0];
    const shouldNotify = isTest || !lastSpending || lastSpending.date <= threshold;

    if (shouldNotify) {
      await sendPushNotification(user.id, {
        title: "지출 기록 알림",
        body: "최근 2일간 지출 내역이 없어요. 오늘 지출을 기록해보세요!",
      });
      results.push({ userId: user.id, sent: true });
    } else {
      results.push({ userId: user.id, sent: false });
    }
  }

  console.log(`[cron/spending-reminder] ${kstDateStr} KST, threshold: ${threshold.toISOString().slice(0, 10)}, results:`, results);

  return NextResponse.json({ ok: true, date: kstDateStr, results });
}
