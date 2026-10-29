import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-semibold text-slate-900">
        <span aria-hidden className="grid size-8 place-items-center rounded-full bg-pitch-700 text-sm text-white">
          C
        </span>
        Criico
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
