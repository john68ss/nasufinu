"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-3" aria-busy="true" aria-label={`${title} se încarcă`}>
      <Skeleton className="mx-1 h-6 w-32" />
      <Card className="p-4">
        <Skeleton className="mb-3 h-7 w-28" />
        <Skeleton className="h-56 w-full" />
      </Card>
    </section>
  );
}

// Recharts is heavy: load it in its own chunk, only in the browser.
export const PriceChartLazy = dynamic(() => import("./price-chart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <ChartSkeleton title="Grafic preț" />,
});

export const EarningsChartLazy = dynamic(() => import("./earnings-chart").then((m) => m.EarningsChart), {
  ssr: false,
  loading: () => <ChartSkeleton title="Grafic câștiguri" />,
});

export const HashrateChartLazy = dynamic(() => import("./hashrate-chart").then((m) => m.HashrateChart), {
  ssr: false,
  loading: () => (
    <Card className="p-4">
      <Skeleton className="h-56 w-full" />
    </Card>
  ),
});
