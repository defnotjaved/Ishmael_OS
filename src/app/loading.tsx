function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-line bg-surface ${className ?? ""}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}
