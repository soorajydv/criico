"use client";

import { logoutAction } from "../(auth)/actions";
import { Icon } from "@/components/ui";

export function LogoutForm() {
  return (
    <form
      action={logoutAction}
      onSubmit={(event) => {
        if (!window.confirm("Are you sure you want to sign out?")) event.preventDefault();
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg border border-[#dfe7e1] bg-white px-3 py-2 text-xs font-semibold text-[#63718b] shadow-sm transition hover:border-[#b8d2c1] hover:bg-[#f5faf6] hover:text-[#0e5a3c]"
      >
        <Icon name="log-out" size={15} />
        Sign out
      </button>
    </form>
  );
}
