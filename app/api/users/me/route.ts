import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { colorChip: true } });

  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    colorChip: user?.colorChip ?? "#6366f1",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { name, currentPassword, newPassword, colorChip } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });

  const updateData: { name?: string; passwordHash?: string; colorChip?: string } = {};

  if (name && name.trim()) {
    updateData.name = name.trim();
  }

  if (colorChip && /^#[0-9a-fA-F]{6}$/.test(colorChip)) {
    updateData.colorChip = colorChip;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "현재 비밀번호를 입력해주세요." }, { status: 400 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 400 });

  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    // BudgetChangeVote: 내가 만든 요청의 투표 + 내가 한 투표
    const myRequests = await tx.budgetChangeRequest.findMany({
      where: { requestedById: userId },
      select: { id: true },
    });
    const myRequestIds = myRequests.map((r) => r.id);

    await tx.budgetChangeVote.deleteMany({
      where: {
        OR: [
          { userId },
          ...(myRequestIds.length > 0 ? [{ requestId: { in: myRequestIds } }] : []),
        ],
      },
    });
    await tx.budgetChangeRequest.deleteMany({ where: { requestedById: userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.savingGoal.deleteMany({ where: { userId } });
    await tx.spending.deleteMany({ where: { userId } });
    await tx.invite.deleteMany({ where: { invitedById: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ ok: true });
}
