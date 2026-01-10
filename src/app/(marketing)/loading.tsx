export default function MarketingLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero section skeleton */}
      <section className="border-b-4 border-gray-300 bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 h-16 w-3/4 bg-gray-200 border-3 border-gray-300" />
          <div className="mx-auto mb-8 h-6 w-2/3 bg-gray-100 border-2 border-gray-200" />
          <div className="mx-auto h-14 w-48 bg-gray-200 border-3 border-gray-300" />
        </div>
      </section>

      {/* Features section skeleton */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 h-10 w-64 bg-gray-200 border-3 border-gray-300" />
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-3 border-gray-300 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(209,213,219,1)]"
              >
                <div className="mb-4 h-12 w-12 bg-gray-200 border-2 border-gray-300" />
                <div className="mb-2 h-6 w-3/4 bg-gray-200 border-2 border-gray-300" />
                <div className="h-4 w-full bg-gray-100 border border-gray-200" />
                <div className="mt-2 h-4 w-2/3 bg-gray-100 border border-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
