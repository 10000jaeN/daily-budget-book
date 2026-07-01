import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const active = await prisma.budgetSetting.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "desc" },
  });

  const pending = await prisma.budgetChangeRequest.findFirst({
    where: { budgetSetting: { status: "PENDING" } },
    include: {
      budgetSetting: true,
      requestedBy: { select: { id: true, name: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  return NextResponse.json({ active, pending, totalUsers: users.length, users });
}
