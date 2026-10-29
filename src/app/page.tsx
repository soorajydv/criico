import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

const FEATURES = [
  { title: "Player management", body: "Add and edit players with role, base price and career stats." },
  { title: "Match recording", body: "Log results and scorecards; career totals update in one transaction." },
  { title: "Impact leaderboard", body: "Rank every player by a transparent, role-aware Impact Score." },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4">
      <header className="flex items-center justify-between py-6">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-pitch-700 text-sm text-white">
            C
          </span>
          Criico
        </span>
        <nav className="flex gap-2 text-sm">
          {session ? (
            <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register">Get started</ButtonLink>
            </>
          )}
        </nav>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Run your local cricket club from one dashboard.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Track players, record matches and see who really makes the difference with the Cricket Impact Score.
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink href={session ? "/dashboard" : "/login"}>{session ? "Go to dashboard" : "Sign in"}</ButtonLink>
          <ButtonLink href="/dashboard/leaderboard" variant="secondary">
            View leaderboard
          </ButtonLink>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-6 text-sm text-slate-500">
        Public API: <Link href="/api/leaderboard" className="font-mono hover:underline">GET /api/leaderboard</Link>
      </footer>
    </main>
  );
}
