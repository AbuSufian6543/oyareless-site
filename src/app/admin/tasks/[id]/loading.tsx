export default function TaskLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading task">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-12 w-full max-w-xl animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
