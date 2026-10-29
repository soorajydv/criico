import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { formatMatchDate } from "@/lib/format";
import { listMatches, type MatchDTO } from "@/lib/services/matches";
import type { TeamSide } from "@/lib/validation/match";
import { describeResult } from "./match-result";

export const metadata: Metadata = { title: "Matches" };
export const dynamic = "force-dynamic";

function Scorecard({ match, side }: { match: MatchDTO; side: TeamSide }) {
  const rows = match.performances.filter((p) => p.team === side);
  const won = match.result === (side === "A" ? "TEAM_A" : "TEAM_B");
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {side === "A" ? match.teamA : match.teamB}
        {won && <span className="rounded bg-pitch-50 px-1.5 py-0.5 text-xs font-medium text-pitch-800">Won</span>}
      </h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="pb-1 text-left font-medium">Player</th>
            <th className="pb-1 text-right font-medium">R</th>
            <th className="pb-1 text-right font-medium">W</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.playerId}>
              <td className="py-0.5">
                <Link href={`/dashboard/players/${p.playerId}`} className="text-slate-700 hover:text-pitch-700 hover:underline">
                  {p.playerName}
                </Link>
              </td>
              <td className="py-0.5 text-right tabular-nums">{p.runs}</td>
              <td className="py-0.5 text-right tabular-nums">{p.wickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PAGE_SIZE = 5;

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [session, allMatches] = await Promise.all([getSession(), listMatches()]);
  const isAdmin = session?.role === "ADMIN";
  const normalized = query.toLowerCase();
  const filteredMatches = allMatches.filter((match) =>
    !normalized || `${match.teamA} ${match.teamB} ${match.result} ${match.performances.map((performance) => performance.playerName).join(" ")}`.toLowerCase().includes(normalized),
  );
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const matches = filteredMatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `/dashboard/matches?${search}` : "/dashboard/matches";
  };

  return (
    <>
      <PageHeader
        title="Matches"
        description="Results and scorecards. Recording a match updates every listed player's stats."
        actions={isAdmin && <ButtonLink href="/dashboard/matches/new">Record match</ButtonLink>}
      />
      <form method="get" className="mb-5 flex gap-2">
        <input name="q" defaultValue={query} placeholder="Search teams or players" className="h-9 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-pitch-500 focus:ring-2 focus:ring-pitch-100" />
        <button type="submit" className="rounded-lg bg-pitch-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-pitch-800">Search</button>
      </form>
      {matches.length === 0 ? (
        <EmptyState
          title={query ? "No matching matches" : "No matches recorded"}
          description={query ? "Try another team or player name." : "Record a match to add each performance to the players' career totals."}
          action={isAdmin && <ButtonLink href="/dashboard/matches/new">Record the first match</ButtonLink>}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  {match.teamA} <span className="font-normal text-slate-400">vs</span> {match.teamB}
                </h2>
                <p className="text-sm text-slate-500">
                  {formatMatchDate(match.playedOn)} · <span className="font-medium text-slate-700">{describeResult(match)}</span>
                </p>
              </div>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <Scorecard match={match} side="A" />
                <Scorecard match={match} side="B" />
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefFor} />
    </>
  );
}
