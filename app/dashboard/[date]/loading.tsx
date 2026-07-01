export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
      <div className="w-40 h-7 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-16 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-16 animate-pulse" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-36 animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
