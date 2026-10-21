import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Se încarcă panoul">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 7 }, (_, i) => (
          <Card key={i} className={i === 0 || i === 6 ? "col-span-2 space-y-2 lg:col-span-1" : "space-y-2"}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
}
