export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-stone-200 rounded w-1/3"></div>
            <div className="h-4 bg-stone-100 rounded w-16"></div>
          </div>
          <div className="h-3 bg-stone-100 rounded w-2/3"></div>
          <div className="flex items-center gap-2 pt-2">
            <div className="w-6 h-6 rounded-full bg-stone-200"></div>
            <div className="h-3 bg-stone-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
