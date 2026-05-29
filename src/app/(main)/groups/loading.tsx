export default function GroupsLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-72 animate-pulse rounded-md bg-muted" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
