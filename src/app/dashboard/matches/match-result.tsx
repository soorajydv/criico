import type { MatchDTO } from "@/lib/services/matches";

export function describeResult(match: Pick<MatchDTO, "result" | "teamA" | "teamB">): string {
  switch (match.result) {
    case "TEAM_A":
      return `${match.teamA} won`;
    case "TEAM_B":
      return `${match.teamB} won`;
    case "TIE":
      return "Match tied";
    case "NO_RESULT":
      return "No result";
  }
}

export function MatchResultLine({ match }: { match: Pick<MatchDTO, "result" | "teamA" | "teamB"> }) {
  return <span>{describeResult(match)}</span>;
}
