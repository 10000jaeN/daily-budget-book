import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCumulativeBalance } from "@/lib/budget";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const goals = await prisma.savingGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const balance = await getCumulativeBalance(session.user.id, new Date());

  return NextResponse.json({ goals, currentBalance: balance });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { title, amount } = await req.json();
  if (!title || !amount) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const balance = await getCumulativeBalance(session.user.id, new Date());
  const isAlreadyAchieved = balance >= Number(amount);

  const goal = await prisma.savingGoal.create({
    data: {
      userId: session.user.id,
      title,
      amount: Number(amount),
      achievedAt: isAlreadyAchieved ? new Date() : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
