import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { PLAYER_ROLE_LABELS, type PlayerRole } from "@/lib/players/roles";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type IconName = "home" | "users" | "calendar" | "trophy" | "clock" | "search" | "bell" | "chevron-down" | "log-out" | "chart" | "activity" | "circle";

export function Icon({ name, size = 18, strokeWidth = 1.8, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true };
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9.5h18" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4" /><path d="M9 3h6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "log-out": <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-5" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
    activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    circle: <><circle cx="12" cy="12" r="8" /><path d="M8 12h8M12 8v8" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const buttonVariants = {
  primary: "bg-pitch-700 text-white hover:bg-pitch-800 focus-visible:outline-pitch-700",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400",
  danger: "text-red-700 hover:bg-red-50 focus-visible:outline-red-600",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-[38px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

const fieldInput =
  "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 focus:outline-pitch-600";

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function Input({ invalid, className, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.name ? `${props.name}-error` : undefined}
      className={cn(fieldInput, invalid ? "border-red-400" : "border-slate-300", className)}
      {...props}
    />
  );
}

export function Select({ invalid, className, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(fieldInput, invalid ? "border-red-400" : "border-slate-300", className)}
      {...props}
    />
  );
}

const roleStyles: Record<PlayerRole, string> = {
  BATSMAN: "bg-amber-50 text-amber-800 ring-amber-200",
  BOWLER: "bg-sky-50 text-sky-800 ring-sky-200",
  ALL_ROUNDER: "bg-violet-50 text-violet-800 ring-violet-200",
  WICKETKEEPER: "bg-pitch-50 text-pitch-800 ring-pitch-200",
};

export function RoleBadge({ role }: { role: PlayerRole }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", roleStyles[role])}>
      {PLAYER_ROLE_LABELS[role]}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Pagination({ page, totalPages, hrefForPage }: { page: number; totalPages: number; hrefForPage: (page: number) => string }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <Link
        href={hrefForPage(page - 1)}
        aria-disabled={page === 1}
        className={cn(
          "rounded-lg border px-3 py-1.5 transition",
          page === 1 ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-300 bg-white text-slate-600 hover:border-pitch-300 hover:text-pitch-700",
        )}
      >
        Previous
      </Link>
      <span className="text-slate-500">Page {page} of {totalPages}</span>
      <Link
        href={hrefForPage(page + 1)}
        aria-disabled={page === totalPages}
        className={cn(
          "rounded-lg border px-3 py-1.5 transition",
          page === totalPages ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-300 bg-white text-slate-600 hover:border-pitch-300 hover:text-pitch-700",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
