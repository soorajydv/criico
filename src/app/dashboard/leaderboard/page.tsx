import type { Metadata } from "next";
import Link from "next/link";
import { Card, cn, EmptyState, PageHeader, Pagination, RoleBadge } from "@/components/ui";
import { formatInt, formatScore } from "@/lib/format";
import { getLeaderboard } from "@/lib/services/leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };
// Always read fresh stats; a recorded match must show up immediately.
export const dynamic = "force-dynamic";

const signed = (value: number) => (value > 0 ? `+${formatScore(value)}` : formatScore(value));

/**
 * React Server Component: fetches and ranks players on the server (straight
 * from the service layer, no client-side fetch or extra HTTP hop) and streams
 * finished HTML. loading.tsx is shown while this resolves.
 */
const PAGE_SIZE = 10;

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const allLeaderboard = await getLeaderboard();
  const normalized = query.toLowerCase();
  const filteredLeaderboard = allLeaderboard.filter((player) =>
    !normalized || `${player.name} ${player.role}`.toLowerCase().includes(normalized),
  );
  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const leaderboard = filteredLeaderboard.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `/dashboard/leaderboard?${search}` : "/dashboard/leaderboard";
  };

  return (
    <>
      <PageHeader title="Leaderboard" description="Players ranked by Cricket Impact Score." />

      <form method="get" className="mb-5 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Search leaderboard" className="h-9 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-pitch-500 focus:ring-2 focus:ring-pitch-100" />
        <button type="submit" className="rounded-lg bg-pitch-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-pitch-800">Search</button>
      </form>

      {leaderboard.length === 0 ? (
        <EmptyState title={query ? "No matching players" : "No players to rank"} description={query ? "Try another player name or role." : "Add players and their Impact Scores will be ranked here."} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">M</th>
                <th className="px-4 py-3 text-right">Runs</th>
                <th className="px-4 py-3 text-right">Wkts</th>
                <th className="px-4 py-3 text-right">Run pts</th>
                <th className="px-4 py-3 text-right">Wkt pts</th>
                <th className="px-4 py-3 text-right">Bonus</th>
                <th className="px-4 py-3 text-right">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((player) => {
                const bonus = player.breakdown.roleBonus + player.breakdown.experienceAdjustment;
                return (
                  <tr key={player.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full text-xs font-semibold tabular-nums",
                          player.rank === 1 && "bg-amber-100 text-amber-800",
                          player.rank === 2 && "bg-slate-200 text-slate-700",
                          player.rank === 3 && "bg-orange-100 text-orange-800",
                          player.rank > 3 && "text-slate-500",
                        )}
                      >
                        {player.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/players/${player.id}`}
                          className="font-medium text-slate-900 hover:text-pitch-700 hover:underline"
                        >
                          {player.name}
                        </Link>
                        <RoleBadge role={player.role} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.matchesPlayed)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.totalRuns)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.totalWickets)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatScore(player.breakdown.runPoints)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatScore(player.breakdown.wicketPoints)}</td>
                    <td className={cn("px-4 py-3 text-right tabular-nums", bonus < 0 ? "text-red-600" : "text-slate-600")}>
                      {bonus === 0 ? "—" : signed(bonus)}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-slate-900">
                      {formatScore(player.impactScore)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefFor} />

      <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-900">How is the Impact Score calculated?</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Base score: (Total Runs × 1.2) + (Total Wickets × 20)</li>
          <li>Batsman: runs × 1.3 before the base score. Bowler: wickets × 1.5 before the base score.</li>
          <li>Wicketkeeper: flat +30, and never the Bowler wicket multiplier.</li>
          <li>Fewer than 5 matches: −50 (rookie). More than 20 matches: +100 (veteran).</li>
        </ul>
      </details>
    </>
  );
}
