import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, cn, EmptyState, PageHeader, Pagination, RoleBadge } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { formatInt, formatNPR, formatScore } from "@/lib/format";
import { isPlayerRole, PLAYER_ROLE_LABELS, PLAYER_ROLES } from "@/lib/players/roles";
import { calculateImpactScore } from "@/lib/scoring/impact-score";
import { listPlayers } from "@/lib/services/players";

export const metadata: Metadata = { title: "Players" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string; page?: string }> }) {
  const { role, q, page: pageParam } = await searchParams;
  const activeRole = isPlayerRole(role) ? role : undefined;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const [session, allPlayers] = await Promise.all([getSession(), listPlayers()]);
  const isAdmin = session?.role === "ADMIN";
  const filteredPlayers = allPlayers.filter((player) => {
    const roleMatches = !activeRole || player.role === activeRole;
    const queryMatches = !query || `${player.name} ${player.role}`.toLowerCase().includes(query.toLowerCase());
    return roleMatches && queryMatches;
  });
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const players = filteredPlayers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (activeRole) params.set("role", activeRole);
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `/dashboard/players?${search}` : "/dashboard/players";
  };

  const filters = [{ value: undefined, label: "All" }, ...PLAYER_ROLES.map((r) => ({ value: r, label: PLAYER_ROLE_LABELS[r] }))];

  return (
    <>
      <PageHeader
        title="Players"
        description={`${filteredPlayers.length} matching player${filteredPlayers.length === 1 ? "" : "s"}`}
        actions={isAdmin && <ButtonLink href="/dashboard/players/new">Add player</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const params = new URLSearchParams();
            if (filter.value) params.set("role", filter.value);
            if (query) params.set("q", query);
            const search = params.toString();
            return (
              <Link
                key={filter.label}
                href={search ? `/dashboard/players?${search}` : "/dashboard/players"}
                className={cn(
                  "rounded-full px-3 py-1 text-sm ring-1 ring-inset",
                  activeRole === filter.value
                    ? "bg-pitch-700 text-white ring-pitch-700"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="flex gap-2">
          {activeRole && <input type="hidden" name="role" value={activeRole} />}
          <input name="q" defaultValue={query} placeholder="Search players" className="h-9 w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-pitch-500 focus:ring-2 focus:ring-pitch-100" />
          <button type="submit" className="rounded-lg bg-pitch-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-pitch-800">Search</button>
        </form>
      </div>

      {players.length === 0 ? (
        <EmptyState
          title={activeRole ? `No ${PLAYER_ROLE_LABELS[activeRole].toLowerCase()}s yet` : "No players yet"}
          description="Players you add appear here with their career stats and Impact Score."
          action={isAdmin && <ButtonLink href="/dashboard/players/new">Add the first player</ButtonLink>}
        />
      ) : (
          <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Base Price</th>
                <th className="px-4 py-3 text-right">Matches</th>
                <th className="px-4 py-3 text-right">Runs</th>
                <th className="px-4 py-3 text-right">Wickets</th>
                <th className="px-4 py-3 text-right">Impact</th>
                {isAdmin && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/dashboard/players/${player.id}`} className="hover:text-pitch-700 hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={player.role} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNPR(player.basePrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.matchesPlayed)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.totalRuns)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(player.totalWickets)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatScore(calculateImpactScore(player))}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/players/${player.id}/edit`} className="text-pitch-700 hover:underline">
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </Card>
      )}
      <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefFor} />
    </>
  );
}
