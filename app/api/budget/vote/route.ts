import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { requestId, approved } = await req.json();
  if (!requestId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  // 이미 투표했는지 확인
  const existingVote = await prisma.budgetChangeVote.findUnique({
    where: { requestId_userId: { requestId, userId: session.user.id } },
  });
  if (existingVote) {
    // 투표 변경 허용
    await prisma.budgetChangeVote.update({
      where: { id: existingVote.id },
      data: { approved, votedAt: new Date() },
    });
  } else {
    await prisma.budgetChangeVote.create({
      data: { requestId, userId: session.user.id, approved },
    });
  }

  // 전체 투표 현황 확인
  const request = await prisma.budgetChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      votes: true,
      budgetSetting: true,
    },
  });
  if (!request) return NextResponse.json({ error: "요청 없음" }, { status: 404 });

  const totalUsers = await prisma.user.count();
  const votes = await prisma.budgetChangeVote.findMany({ where: { requestId } });
  const approvedCount = votes.filter((v) => v.approved).length;
  const rejectedCount = votes.filter((v) => !v.approved).length;

  if (rejectedCount > 0) {
    // 1명이라도 반대 → 거부
    await prisma.budgetSetting.update({
      where: { id: request.budgetSettingId },
      data: { status: "REJECTED" },
    });

    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "BUDGET_CHANGED" as const,
        message: `예산 변경 요청이 반대로 인해 거부되었습니다.`,
      })),
    });
  } else if (approvedCount === totalUsers) {
    // 전원 찬성 → 승인
    await prisma.budgetSetting.update({
      where: { id: request.budgetSettingId },
      data: { status: "ACTIVE" },
    });

    const users = await prisma.user.findMany({ select: { id: true } });
    const amount = request.budgetSetting.amount;
    const from = request.budgetSetting.effectiveFrom.toISOString().slice(0, 10);

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "BUDGET_CHANGED" as const,
        message: `예산 한도가 ${amount.toLocaleString()}원으로 변경됩니다. (${from} 적용)`,
      })),
    });

    for (const u of users) {
      await sendPushNotification(u.id, {
        title: "예산 한도 변경",
        body: `${amount.toLocaleString()}원으로 변경됩니다. (${from} 적용)`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
