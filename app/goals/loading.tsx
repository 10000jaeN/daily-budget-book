export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="bg-indigo-600 rounded-2xl p-5 h-24 animate-pulse opacity-70" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-48 animate-pulse" />
    </div>
  );
}
