import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCalendarData } from "@/lib/calendarData";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const days = await getCalendarData(session.user.id, year, month);

  return <DashboardClient initialYear={year} initialMonth={month} initialDays={days} />;
}
