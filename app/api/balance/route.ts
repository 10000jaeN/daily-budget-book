import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCumulativeBalance } from "@/lib/budget";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const targetDate = date ? new Date(date) : new Date();

  const balance = await getCumulativeBalance(session.user.id, targetDate);
  return NextResponse.json({ balance });
}
