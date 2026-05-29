import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import { UserMenu } from "@/components/layout/user-menu";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="flex w-16 flex-col items-center border-r bg-muted/30 py-4">
        <MainNav />
        <div className="mt-auto">
          <UserMenu user={session} />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
