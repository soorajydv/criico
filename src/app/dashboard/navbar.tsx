import Image from "next/image";
import { DashboardNav } from "./nav";
import { ProfileMenu } from "./profile-menu";

export function Navbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="border-b border-[#dfe7e1] bg-white/90 backdrop-blur md:h-20">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-5 py-3 md:px-8">
        <div className="flex items-center gap-3 md:hidden">
          <Image src="/assets/criico-mark.png" alt="" aria-hidden width={36} height={36} className="size-9 object-contain" />
          <span className="font-semibold">Criico</span>
        </div>
        <div className="md:hidden"><DashboardNav /></div>
        <div className="ml-auto"><ProfileMenu name={name} role={role} /></div>
      </div>
    </header>
  );
}
