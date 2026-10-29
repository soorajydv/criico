import Image from "next/image";
import Link from "next/link";
import { DashboardNav } from "./nav";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-pitch-700 text-white md:flex">
      <div className="relative z-10 flex h-24 items-center gap-3 border-b border-white/10 px-8">
        <Image src="/assets/criico-mark.png" alt="" aria-hidden width={40} height={40} className="size-10 object-contain" />
        <Link href="/dashboard" className="text-2xl font-semibold tracking-tight">Criico</Link>
      </div>
      <DashboardNav />
      <div className="relative mt-auto h-80 overflow-hidden">
        <Image
          src="/assets/cricket-batter.png"
          alt=""
          aria-hidden
          width={210}
          height={315}
          className="pointer-events-none absolute -bottom-16 -left-3 w-64 opacity-20"
        />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-[#f0c45c]" />
    </aside>
  );
}
