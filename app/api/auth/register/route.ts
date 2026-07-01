import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  // 첫 번째 가입자는 토큰 없이 가입 가능 (자동으로 ADMIN 부여)
  if (!isFirstUser) {
    if (!token) {
      return NextResponse.json({ error: "초대 링크가 필요합니다." }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "유효하지 않거나 만료된 초대 링크입니다." }, { status: 400 });
    }

    // 이메일 중복 체크
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "MEMBER" },
    });

    await prisma.invite.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  }

  // 최초 관리자 가입
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: "ADMIN" },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
