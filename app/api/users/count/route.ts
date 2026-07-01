import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 인증 없이 접근 가능 (회원가입 페이지에서 첫 사용자 여부 확인용)
export async function GET() {
  const count = await prisma.user.count();
  return NextResponse.json({ count });
}
