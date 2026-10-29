import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { listPlayers } from "@/lib/services/players";
import { MatchForm } from "../match-form";

export const metadata: Metadata = { title: "Record match" };
export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard/matches");

  const players = await listPlayers();

  return (
    <>
      <PageHeader
        title="Record match"
        description="Each performance is added to the player's career runs, wickets and matches played."
      />
      {players.length < 2 ? (
        <EmptyState
          title="Not enough players"
          description="A match needs at least one player on each side. Add players first."
          action={<ButtonLink href="/dashboard/players/new">Add player</ButtonLink>}
        />
      ) : (
        <MatchForm players={players.map(({ id, name, role }) => ({ id, name, role }))} />
      )}
    </>
  );
}
