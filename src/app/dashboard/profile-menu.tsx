"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { logoutAction } from "../(auth)/actions";

export function ProfileMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#f4f8f5]"
      >
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold text-[#14213d]">{name}</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#789181]">{role}</span>
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-pitch-700 text-sm font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
        <Icon name="chevron-down" size={15} className={open ? "rotate-180 text-[#0e5a3c] transition" : "text-[#718096] transition"} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-xl border border-[#dfe7e1] bg-white p-1.5 shadow-[0_12px_30px_rgba(20,33,61,0.14)]">
          <form
            action={logoutAction}
            onSubmit={(event) => {
              if (!window.confirm("Are you sure you want to sign out?")) event.preventDefault();
            }}
          >
            <button type="submit" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#63718b] transition hover:bg-[#f1f7f3] hover:text-[#0e5a3c]">
              <Icon name="log-out" size={15} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
