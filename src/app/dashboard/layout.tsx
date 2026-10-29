import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts already guards /dashboard; this is a second check so the
  // layout never renders without a verified session.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#14213d] md:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar name={session.name} role={session.role} />
        <main className="mx-auto max-w-[1600px] px-5 py-7 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
