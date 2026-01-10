export default function AuthLoading() {
  return (
    <div className="animate-pulse">
      {/* Auth card skeleton */}
      <div className="w-full max-w-md border-4 border-gray-300 bg-white p-8 shadow-[6px_6px_0px_0px_rgba(209,213,219,1)]">
        {/* Title */}
        <div className="mb-6 h-8 w-48 bg-gray-200 border-2 border-gray-300" />

        {/* Social buttons */}
        <div className="mb-6 space-y-3">
          <div className="h-12 w-full bg-gray-100 border-3 border-gray-300" />
          <div className="h-12 w-full bg-gray-100 border-3 border-gray-300" />
        </div>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-0.5 flex-1 bg-gray-300" />
          <div className="h-4 w-8 bg-gray-200" />
          <div className="h-0.5 flex-1 bg-gray-300" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 h-4 w-16 bg-gray-200" />
            <div className="h-12 w-full bg-gray-100 border-3 border-gray-300" />
          </div>
          <div>
            <div className="mb-2 h-4 w-20 bg-gray-200" />
            <div className="h-12 w-full bg-gray-100 border-3 border-gray-300" />
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-6 h-12 w-full bg-gray-200 border-3 border-gray-300" />

        {/* Footer link */}
        <div className="mt-4 flex justify-center">
          <div className="h-4 w-40 bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
