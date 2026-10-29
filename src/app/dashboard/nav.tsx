"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Icon, type IconName } from "@/components/ui";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: "home" as IconName },
  { href: "/dashboard/players", label: "Players", icon: "users" as IconName },
  { href: "/dashboard/matches", label: "Matches", icon: "calendar" as IconName },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: "trophy" as IconName },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto text-sm md:block md:space-y-3 md:px-5 md:py-10">
      {LINKS.map(({ href, label, icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 transition md:px-4 md:py-3.5",
              active ? "bg-pitch-600 font-semibold text-white shadow-[inset_3px_0_0_#f0c45c]" : "text-emerald-50/80 hover:bg-pitch-800/40 hover:text-white",
            )}
          >
            <Icon name={icon} size={18} className={active ? "text-[#f0c45c]" : "text-emerald-100/70"} />
            <span className="md:text-[15px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
