import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.savingGoal.findUnique({ where: { id } });

  if (!goal || goal.userId !== session.user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await prisma.savingGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
