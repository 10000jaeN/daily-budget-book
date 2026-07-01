import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { amount, effectiveFrom } = await req.json();
  if (!amount || !effectiveFrom) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  // 이미 대기 중인 요청이 있는지 확인
  const existing = await prisma.budgetChangeRequest.findFirst({
    where: { budgetSetting: { status: "PENDING" } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 대기 중인 변경 요청이 있습니다." }, { status: 409 });
  }

  const budgetSetting = await prisma.budgetSetting.create({
    data: {
      amount: Number(amount),
      effectiveFrom: new Date(effectiveFrom),
      status: "PENDING",
    },
  });

  const request = await prisma.budgetChangeRequest.create({
    data: {
      budgetSettingId: budgetSetting.id,
      requestedById: session.user.id,
    },
  });

  // 모든 사용자에게 투표 요청 알림 발송
  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u: { id: string }) => ({
      userId: u.id,
      type: "VOTE_REQUESTED" as const,
      message: `예산 한도 변경 요청이 있습니다. (${Number(amount).toLocaleString()}원 / ${effectiveFrom} 적용)`,
    })),
  });

  return NextResponse.json({ budgetSetting, request }, { status: 201 });
}
