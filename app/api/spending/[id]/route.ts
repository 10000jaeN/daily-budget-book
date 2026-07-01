import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndNotifyGoals } from "@/lib/goalCheck";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const spending = await prisma.spending.findUnique({ where: { id } });
  if (!spending) return NextResponse.json({ error: "없는 지출입니다." }, { status: 404 });

  await prisma.spending.delete({ where: { id } });

  // 삭제 후 목표 달성 체크 (잔액 증가 시)
  await checkAndNotifyGoals(spending.userId);

  return NextResponse.json({ ok: true });
}
