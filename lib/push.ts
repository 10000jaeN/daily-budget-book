import webpush from "web-push";
import { prisma } from "@/lib/prisma";

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string }
) {
  const sub = await prisma.pushSubscription.findUnique({ where: { userId } });
  if (!sub) return;

  try {
    await webpush.sendNotification(
      sub.subscription as unknown as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    // 구독이 만료된 경우 삭제
    if ((err as { statusCode?: number }).statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { userId } });
    }
  }
}
