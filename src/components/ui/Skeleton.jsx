export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-20 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
