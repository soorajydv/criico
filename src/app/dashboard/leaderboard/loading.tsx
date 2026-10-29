import { Card } from "@/components/ui";

export default function LeaderboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading leaderboard">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200" />
      <Card className="divide-y divide-slate-100">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="size-7 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </Card>
    </div>
  );
}
