export default function EditorLoading() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      {/* Editor header skeleton */}
      <header className="flex items-center justify-between border-b-4 border-gray-300 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 border-2 border-gray-300" />
          <div className="h-6 w-48 bg-gray-200 border-2 border-gray-300" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-gray-100 border-2 border-gray-200" />
          <div className="h-8 w-8 bg-gray-200 border-2 border-gray-300" />
          <div className="h-8 w-8 bg-gray-200 border-2 border-gray-300" />
        </div>
      </header>

      {/* Toolbar skeleton */}
      <div className="border-b-2 border-gray-200 bg-gray-50 px-6 py-2">
        <div className="flex items-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-gray-200 border border-gray-300"
            />
          ))}
          <div className="mx-2 h-6 w-0.5 bg-gray-300" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-gray-200 border border-gray-300"
            />
          ))}
        </div>
      </div>

      {/* Editor content skeleton */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="mx-auto max-w-4xl px-8 py-12">
          {/* Title placeholder */}
          <div className="mb-8 h-12 w-2/3 bg-gray-200 border-2 border-gray-300" />

          {/* Paragraph placeholders */}
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="h-4 w-4/5 bg-gray-100 border border-gray-200" />
            <div className="h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="h-4 w-3/4 bg-gray-100 border border-gray-200" />
          </div>

          {/* Subheading placeholder */}
          <div className="mt-12 mb-6 h-8 w-1/2 bg-gray-200 border-2 border-gray-300" />

          {/* More paragraph placeholders */}
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="h-4 w-full bg-gray-100 border border-gray-200" />
            <div className="h-4 w-2/3 bg-gray-100 border border-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
