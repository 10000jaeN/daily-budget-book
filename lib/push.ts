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
  if (!sub) {
    console.warn(`[push] 구독 없음 (userId=${userId})`);
    return;
  }

  try {
    const result = await webpush.sendNotification(
      sub.subscription as unknown as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    console.log(`[push] 발송 성공 (userId=${userId}, status=${result.statusCode})`);
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410) {
      // 구독 만료 → DB에서 삭제
      console.warn(`[push] 구독 만료, DB 삭제 (userId=${userId})`);
      await prisma.pushSubscription.delete({ where: { userId } });
    } else {
      console.error(`[push] 알림 발송 실패 (userId=${userId}, status=${status}):`, err);
    }
  }
}
