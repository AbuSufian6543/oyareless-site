export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
