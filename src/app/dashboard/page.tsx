import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, Icon, PageHeader, RoleBadge, cn, type IconName } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { formatMatchDate, formatScore } from "@/lib/format";
import { getLeaderboard } from "@/lib/services/leaderboard";
import { countMatches, listMatches } from "@/lib/services/matches";
import { MatchResultLine } from "./matches/match-result";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, leaderboard, matchCount, recentMatches] = await Promise.all([
    getSession(),
    getLeaderboard(),
    countMatches(),
    listMatches(3),
  ]);
  const isAdmin = session?.role === "ADMIN";
  const totalRuns = leaderboard.reduce((sum, p) => sum + p.totalRuns, 0);
  const totalWickets = leaderboard.reduce((sum, p) => sum + p.totalWickets, 0);

  const stats = [
    { label: "Players", value: leaderboard.length, icon: "users" as IconName },
    { label: "Matches recorded", value: matchCount, icon: "calendar" as IconName },
    { label: "Career runs", value: totalRuns.toLocaleString("en-IN"), icon: "chart" as IconName },
    { label: "Career wickets", value: totalWickets.toLocaleString("en-IN"), icon: "activity" as IconName },
  ];

  return (
    <>
      <PageHeader
        title={`Hello, ${session?.name.split(" ")[0] ?? "there"}`}
        description="Your club at a glance."
        actions={
          isAdmin && (
            <>
              <ButtonLink href="/dashboard/players/new" variant="secondary">
                Add player
              </ButtonLink>
              <ButtonLink href="/dashboard/matches/new">Record match</ButtonLink>
            </>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="group relative overflow-hidden border-[#dfe7e1] p-4 shadow-[0_8px_24px_rgba(20,33,61,0.05)]">
            <div className={cn("mb-4 grid size-9 place-items-center rounded-full", index === 2 ? "bg-[#fff3d7] text-[#c18b18]" : "bg-[#e2f4ec] text-[#0e5a3c]")}><Icon name={stat.icon} size={17} /></div>
            <p className="text-sm font-medium text-[#63718b]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-[#14213d]">{stat.value}</p>
            <Icon name={stat.icon} size={68} strokeWidth={1.1} className="pointer-events-none absolute -bottom-4 -right-3 text-[#0e5a3c]/[0.06]" />
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[#14213d]"><Icon name="trophy" size={22} className="text-[#d8a84e]" />Top by Impact Score</h2>
            <Link href="/dashboard/leaderboard" className="text-sm font-medium text-[#0e5a3c] hover:underline">Full leaderboard →</Link>
          </div>
          {leaderboard.length === 0 ? (
            <EmptyState title="No players yet" description="Add players to see who has the biggest impact." />
          ) : (
            <Card className="overflow-hidden divide-y divide-[#e8eee9] border-[#dfe7e1] shadow-[0_8px_24px_rgba(20,33,61,0.05)]">
              <div className="grid grid-cols-[42px_1fr_120px_100px] bg-[#edf5ef] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#63718b]">
                <span>#</span><span>Player</span><span>Role</span><span className="text-right">Impact score</span>
              </div>
              {leaderboard.slice(0, 5).map((player) => (
                <Link
                  key={player.id}
                  href={`/dashboard/players/${player.id}`}
                  className="grid grid-cols-[42px_1fr_120px_100px] items-center gap-3 px-4 py-4 transition hover:bg-[#f5faf6]"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-[#f0f3f1] text-sm font-semibold tabular-nums text-[#63718b]">{player.rank}</span>
                  <span className="truncate font-semibold text-[#14213d]">{player.name}</span>
                  <RoleBadge role={player.role} />
                  <span className="text-right font-semibold tabular-nums text-[#14213d]">{formatScore(player.impactScore)}</span>
                </Link>
              ))}
            </Card>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[#14213d]"><Icon name="clock" size={22} className="text-[#0e5a3c]" />Recent matches</h2>
            <Link href="/dashboard/matches" className="text-sm font-medium text-[#0e5a3c] hover:underline">All matches →</Link>
          </div>
          {recentMatches.length === 0 ? (
            <Card className="flex min-h-[310px] flex-col items-center justify-center border-[#dfe7e1] px-6 py-10 text-center shadow-[0_8px_24px_rgba(20,33,61,0.05)]">
              <Image src="/assets/empty-matches.png" alt="" aria-hidden width={220} height={146} className="mb-3 h-28 w-auto object-contain opacity-70" />
              <h2 className="text-base font-semibold text-[#14213d]">No matches yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#63718b]">Recorded matches update player stats automatically.</p>
            </Card>
          ) : (
            <Card className="min-h-[310px] divide-y divide-[#e8eee9] border-[#dfe7e1] shadow-[0_8px_24px_rgba(20,33,61,0.05)]">
              {recentMatches.map((match) => (
                <div key={match.id} className="px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {match.teamA} <span className="text-slate-400">vs</span> {match.teamB}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatMatchDate(match.playedOn)} · <MatchResultLine match={match} />
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
