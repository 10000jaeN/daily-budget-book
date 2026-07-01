import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const subscription = await req.json();

  await prisma.pushSubscription.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, subscription },
    update: { subscription },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
