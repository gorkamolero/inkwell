export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-10 w-64 bg-gray-200 border-3 border-gray-300" />
          <div className="mt-2 h-5 w-48 bg-gray-100 border-2 border-gray-200" />
        </div>
        <div className="h-12 w-40 bg-gray-200 border-3 border-gray-300" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-3 border-gray-300 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(209,213,219,1)]"
          >
            <div className="mb-4 h-6 w-3/4 bg-gray-200 border-2 border-gray-300" />
            <div className="mb-2 h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="mb-4 h-4 w-2/3 bg-gray-100 border border-gray-200" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-gray-200 border border-gray-300" />
              <div className="h-6 w-20 bg-gray-200 border border-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
