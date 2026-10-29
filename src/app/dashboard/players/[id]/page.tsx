import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Card, PageHeader, RoleBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { formatInt, formatMatchDate, formatNPR, formatScore } from "@/lib/format";
import { getImpactScoreBreakdown, ROLE_MODIFIERS } from "@/lib/scoring/impact-score";
import { listMatchesForPlayer } from "@/lib/services/matches";
import { getPlayer } from "@/lib/services/players";
import { describeResult } from "../../matches/match-result";

export const metadata: Metadata = { title: "Player" };
export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, player, matches] = await Promise.all([
    getSession(),
    getPlayer(id).catch((error) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }),
    listMatchesForPlayer(id),
  ]);

  const breakdown = getImpactScoreBreakdown(player);
  const modifier = ROLE_MODIFIERS[player.role];

  const breakdownRows = [
    {
      label: "Runs",
      detail: `${formatInt(player.totalRuns)} × ${modifier.runMultiplier === 1 ? "" : `${modifier.runMultiplier} × `}1.2`,
      value: breakdown.runPoints,
    },
    {
      label: "Wickets",
      detail: `${formatInt(player.totalWickets)} × ${modifier.wicketMultiplier === 1 ? "" : `${modifier.wicketMultiplier} × `}20`,
      value: breakdown.wicketPoints,
    },
    { label: "Wicketkeeper bonus", detail: "flat", value: breakdown.roleBonus, hidden: breakdown.roleBonus === 0 },
    {
      label: breakdown.experienceAdjustment < 0 ? "Rookie penalty" : "Veteran bonus",
      detail: `${player.matchesPlayed} matches`,
      value: breakdown.experienceAdjustment,
      hidden: breakdown.experienceAdjustment === 0,
    },
  ].filter((row) => !row.hidden);

  return (
    <>
      <PageHeader
        title={player.name}
        description={`Base price ${formatNPR(player.basePrice)}`}
        actions={
          session?.role === "ADMIN" && (
            <ButtonLink href={`/dashboard/players/${player.id}/edit`} variant="secondary">
              Edit player
            </ButtonLink>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <RoleBadge role={player.role} />
            <span className="text-xs text-slate-500">Updated {new Date(player.updatedAt).toLocaleDateString("en-IN")}</span>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Matches", value: player.matchesPlayed },
              { label: "Runs", value: player.totalRuns },
              { label: "Wickets", value: player.totalWickets },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-slate-50 py-3">
                <dt className="text-xs text-slate-500">{stat.label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{formatInt(stat.value)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Impact Score breakdown</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {breakdownRows.map((row) => (
                <tr key={row.label}>
                  <td className="py-2 text-slate-700">{row.label}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">{row.detail}</td>
                  <td className="py-2 text-right tabular-nums">
                    {row.value > 0 ? "+" : ""}
                    {formatScore(row.value)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="pt-3 text-slate-900" colSpan={2}>
                  Impact Score
                </td>
                <td className="pt-3 text-right text-lg tabular-nums text-pitch-800">{formatScore(breakdown.total)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Recorded matches</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-slate-500">No recorded matches yet. Stats above may include earlier career totals.</p>
        ) : (
          <Card className="divide-y divide-slate-100">
            {matches.map((match) => {
              const perf = match.performances.find((p) => p.playerId === player.id)!;
              return (
                <div key={match.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {match.teamA} vs {match.teamB}
                    </p>
                    <p className="text-slate-500">
                      {formatMatchDate(match.playedOn)} · {describeResult(match)} · played for{" "}
                      {perf.team === "A" ? match.teamA : match.teamB}
                    </p>
                  </div>
                  <p className="tabular-nums text-slate-700">
                    {perf.runs} runs · {perf.wickets} wkts
                  </p>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </>
  );
}
