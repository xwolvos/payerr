import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isAdminConfigured, destroySession } from "@/lib/auth";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/costs", label: "Costs" },
  { href: "/settings", label: "Settings" },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    redirect("/setup");
  }
  if (!(await getSession())) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-emerald-600">Payerr</span>
            <nav className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
