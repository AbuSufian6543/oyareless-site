export default function TasksLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
      <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
