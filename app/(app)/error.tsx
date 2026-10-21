"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md space-y-3 text-center">
      <h1 className="text-lg font-semibold">Ceva nu a mers bine</h1>
      <p className="text-sm text-muted">Panoul nu a putut fi afișat. De obicei este o problemă temporară.</p>
      <Button variant="primary" onClick={reset}>
        <RefreshCw className="size-4" />
        Încearcă din nou
      </Button>
    </Card>
  );
}
