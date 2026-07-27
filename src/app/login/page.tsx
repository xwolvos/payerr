import { redirect } from "next/navigation";
import { getSession, isAdminConfigured } from "@/lib/auth";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAdminConfigured()) {
    redirect("/setup");
  }
  if (await getSession()) {
    redirect("/dashboard");
  }
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Payerr</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sign in to continue</p>
        </div>
        <form
          action={login}
          className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              autoFocus
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
