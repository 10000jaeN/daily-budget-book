import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCumulativeBalanceBatch } from "@/lib/budget";
import DateDetailClient from "./DateDetailClient";

export default async function DateDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const session = await auth();
  if (!session) redirect("/");

  const [spendings, users] = await Promise.all([
    prisma.spending.findMany({
      where: {
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({ select: { id: true } }),
  ]);

  const allBalances = await getCumulativeBalanceBatch(
    users.map((u: { id: string }) => u.id),
    new Date(date)
  );

  const serializedSpendings = spendings.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    date: s.date.toISOString(),
  }));

  return (
    <DateDetailClient
      date={date}
      spendings={serializedSpendings}
      allBalances={allBalances}
      sessionUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
