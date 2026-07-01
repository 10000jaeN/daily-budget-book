import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndNotifyGoals } from "@/lib/goalCheck";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  const where = date
    ? {
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      }
    : {};

  const spendings = await prisma.spending.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(spendings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { amount, memo, date } = await req.json();

  if (!amount || !memo || !date) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const spending = await prisma.spending.create({
    data: {
      userId: session.user.id,
      amount: Number(amount),
      memo,
      date: new Date(date),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // 목표 달성 체크
  await checkAndNotifyGoals(session.user.id);

  return NextResponse.json(spending, { status: 201 });
}
