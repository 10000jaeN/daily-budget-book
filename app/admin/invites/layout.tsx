import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={session.user.name} userRole={session.user.role} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">{children}</main>
    </div>
  );
}
