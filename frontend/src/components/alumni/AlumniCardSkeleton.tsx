import { Skeleton } from "@/components/ui/skeleton";

// Mirrors AlumniCard's layout so the results grid holds its size while a
// search is in flight instead of collapsing to a small "Searching..." panel.
export const AlumniCardSkeleton = () => (
  <div className="rounded-card border border-border bg-card p-6 flex flex-col h-full">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>

    <div className="space-y-3 mb-4 flex-1">
      <div className="flex items-center gap-3">
        <Skeleton className="h-[18px] w-[18px] rounded-full shrink-0" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-[18px] w-[18px] rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-[18px] w-[18px] rounded-full shrink-0" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>

    <div className="pt-4 border-t border-border/50">
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  </div>
);
