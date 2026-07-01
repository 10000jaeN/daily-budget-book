export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-600 rounded-2xl p-5 h-28 animate-pulse opacity-70" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border-t border-gray-100 min-h-[60px] p-1.5">
              <div className="w-4 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
