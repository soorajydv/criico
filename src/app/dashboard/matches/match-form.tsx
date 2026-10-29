"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, ButtonLink, Card, Field, Input, Select } from "@/components/ui";
import { PLAYER_ROLE_LABELS, type PlayerRole } from "@/lib/players/roles";
import { firstErrorMessage, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { MAX_PLAYERS_PER_TEAM, matchSchema, type TeamSide } from "@/lib/validation/match";

export interface PlayerOption {
  id: string;
  name: string;
  role: PlayerRole;
}

interface Row {
  key: number;
  playerId: string;
  runs: string;
  wickets: string;
}

let nextKey = 0;
const emptyRow = (): Row => ({ key: nextKey++, playerId: "", runs: "0", wickets: "0" });

export function MatchForm({ players }: { players: PlayerOption[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [rows, setRows] = useState<Record<TeamSide, Row[]>>({ A: [emptyRow()], B: [emptyRow()] });

  // A player may only appear once across both sides.
  const selected = useMemo(
    () => new Set([...rows.A, ...rows.B].map((r) => r.playerId).filter(Boolean)),
    [rows],
  );

  const updateRow = (side: TeamSide, key: number, patch: Partial<Row>) =>
    setRows((prev) => ({ ...prev, [side]: prev[side].map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const addRow = (side: TeamSide) => setRows((prev) => ({ ...prev, [side]: [...prev[side], emptyRow()] }));
  const removeRow = (side: TeamSide, key: number) =>
    setRows((prev) => ({ ...prev, [side]: prev[side].filter((r) => r.key !== key) }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      teamA: form.get("teamA"),
      teamB: form.get("teamB"),
      result: form.get("result"),
      playedOn: form.get("playedOn") || undefined,
      performances: (["A", "B"] as const).flatMap((team) =>
        rows[team]
          .filter((r) => r.playerId)
          .map((r) => ({ playerId: r.playerId, team, runs: r.runs, wickets: r.wickets })),
      ),
    };

    const parsed = matchSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      toast.error(firstErrorMessage(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(body?.error?.fieldErrors ?? {});
        toast.error(body?.error?.message ?? "Could not record the match");
        setPending(false);
        return;
      }
      toast.success("Match recorded and player stats updated");
      router.push("/dashboard/matches");
      router.refresh();
    } catch {
      toast.error("Network error. Check your connection and try again.");
      setPending(false);
    }
  }

  const sides: { side: TeamSide; name: string }[] = [
    { side: "A", name: teamA || "Team A" },
    { side: "B", name: teamB || "Team B" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Team A" name="teamA" error={errors.teamA}>
            <Input id="teamA" name="teamA" value={teamA} onChange={(e) => setTeamA(e.target.value)} minLength={2} maxLength={60} required invalid={!!errors.teamA} />
          </Field>
          <Field label="Team B" name="teamB" error={errors.teamB}>
            <Input id="teamB" name="teamB" value={teamB} onChange={(e) => setTeamB(e.target.value)} minLength={2} maxLength={60} required invalid={!!errors.teamB} />
          </Field>
          <Field label="Result" name="result" error={errors.result}>
            <Select id="result" name="result" defaultValue="" required invalid={!!errors.result}>
              <option value="" disabled>
                Select the result
              </option>
              <option value="TEAM_A">{teamA || "Team A"} won</option>
              <option value="TEAM_B">{teamB || "Team B"} won</option>
              <option value="TIE">Tie</option>
              <option value="NO_RESULT">No result</option>
            </Select>
          </Field>
          <Field label="Match date" name="playedOn" error={errors.playedOn}>
            <Input
              id="playedOn"
              name="playedOn"
              type="date"
              defaultValue={new Date().toLocaleDateString("en-CA")}
              max={new Date().toLocaleDateString("en-CA")}
              required
              invalid={!!errors.playedOn}
            />
          </Field>
        </div>
      </Card>

      {errors.performances && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {errors.performances}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {sides.map(({ side, name }) => (
          <Card key={side} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{name} performances</h2>
              <span className="text-xs text-slate-500">
                {rows[side].length}/{MAX_PLAYERS_PER_TEAM}
              </span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_4.5rem_4.5rem_2rem] gap-2 text-xs font-medium text-slate-500">
                <span>Player</span>
                <span>Runs</span>
                <span>Wickets</span>
                <span />
              </div>
              {rows[side].map((row) => (
                <Fragment key={row.key}>
                <div className="grid grid-cols-[1fr_4.5rem_4.5rem_2rem] items-center gap-2">
                  <Select
                    aria-label={`${name} player`}
                    value={row.playerId}
                    required
                    onChange={(e) => updateRow(side, row.key, { playerId: e.target.value })}
                  >
                    <option value="">Select player</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id} disabled={selected.has(p.id) && p.id !== row.playerId}>
                        {p.name} ({PLAYER_ROLE_LABELS[p.role]})
                      </option>
                    ))}
                  </Select>
                  <Input
                    aria-label="Runs"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={1000}
                    step={1}
                    required
                    value={row.runs}
                    onChange={(e) => updateRow(side, row.key, { runs: e.target.value })}
                  />
                  <Input
                    aria-label="Wickets"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={10}
                    step={1}
                    required
                    value={row.wickets}
                    onChange={(e) => updateRow(side, row.key, { wickets: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(side, row.key)}
                    disabled={rows[side].length === 1}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:invisible"
                    aria-label="Remove player"
                  >
                    ×
                  </button>
                </div>
                {(row.runs !== "" && !/^\d+$/.test(row.runs) || row.wickets !== "" && !/^\d+$/.test(row.wickets)) && (
                  <p className="col-span-4 text-xs text-red-600">Only non-negative whole numbers are allowed.</p>
                )}
                </Fragment>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-3 px-2"
              onClick={() => addRow(side)}
              disabled={rows[side].length >= MAX_PLAYERS_PER_TEAM}
            >
              + Add player
            </Button>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <ButtonLink href="/dashboard/matches" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Recording…" : "Record match"}
        </Button>
      </div>
    </form>
  );
}
