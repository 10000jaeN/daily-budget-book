import { prisma } from "@/lib/prisma";
import { getCumulativeBalance } from "@/lib/budget";
import { sendPushNotification } from "@/lib/push";

export async function checkAndNotifyGoals(userId: string) {
  const today = new Date();
  const balance = await getCumulativeBalance(userId, today);

  const unachievedGoals = await prisma.savingGoal.findMany({
    where: { userId, achievedAt: null },
  });

  for (const goal of unachievedGoals) {
    if (balance >= goal.amount) {
      const now = new Date();

      await prisma.savingGoal.update({
        where: { id: goal.id },
        data: { achievedAt: now },
      });

      const message = `목표 "${goal.title}" (${goal.amount.toLocaleString()}원)을 달성했어요! 🎉`;

      await prisma.notification.create({
        data: {
          userId,
          type: "GOAL_ACHIEVED",
          message,
        },
      });

      await sendPushNotification(userId, {
        title: "목표 달성!",
        body: message,
      });
    }
  }
}
