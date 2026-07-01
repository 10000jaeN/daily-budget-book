import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCumulativeBalance } from "@/lib/budget";
import GoalsClient from "./GoalsClient";

export default async function GoalsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [goals, currentBalance] = await Promise.all([
    prisma.savingGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getCumulativeBalance(session.user.id, new Date()),
  ]);

  const serializedGoals = goals.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    achievedAt: g.achievedAt?.toISOString() ?? null,
  }));

  return <GoalsClient goals={serializedGoals} currentBalance={currentBalance} />;
}
