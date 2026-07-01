import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCumulativeBalance } from "@/lib/budget";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const targetDate = date ? new Date(date) : new Date();

  // all=true 이면 모든 유저 잔액 반환 { userId: balance }
  if (searchParams.get("all") === "true") {
    const users = await prisma.user.findMany({ select: { id: true } });
    const entries = await Promise.all(
      users.map(async (u: { id: string }) => [u.id, await getCumulativeBalance(u.id, targetDate)])
    );
    return NextResponse.json(Object.fromEntries(entries));
  }

  const balance = await getCumulativeBalance(session.user.id, targetDate);
  return NextResponse.json({ balance });
}
