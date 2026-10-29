import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { createPlayerAction } from "../actions";
import { PlayerForm } from "../player-form";

export const metadata: Metadata = { title: "Add player" };

export default async function NewPlayerPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard/players");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add player" description="Career stats can be entered now and grow as matches are recorded." />
      <PlayerForm action={createPlayerAction} />
    </div>
  );
}
