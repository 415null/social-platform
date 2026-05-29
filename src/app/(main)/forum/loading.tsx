export default function ForumLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
