"use client";

import { useEffect } from "react";
import { Button, Card } from "@/components/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">
        We could not load this page. This is usually a temporary database issue.
        {error.digest && <span className="mt-1 block font-mono text-xs text-slate-400">Ref: {error.digest}</span>}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
