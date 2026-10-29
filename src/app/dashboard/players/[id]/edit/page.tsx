import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { getPlayer } from "@/lib/services/players";
import { updatePlayerAction } from "../../actions";
import { PlayerForm } from "../../player-form";

export const metadata: Metadata = { title: "Edit player" };

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect(`/dashboard/players/${id}`);

  const player = await getPlayer(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${player.name}`} description="Update details or correct career stats." />
      <PlayerForm action={updatePlayerAction.bind(null, player.id)} player={player} />
    </div>
  );
}
