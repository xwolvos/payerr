import { redirect } from "next/navigation";
import { isAdminConfigured, getSession } from "@/lib/auth";

// isAdminConfigured() alone gives Next.js no dynamic-API signal, so this
// page (and /login, /setup) can get statically prerendered against the
// empty build-phase database and permanently bake in a stale redirect.
// Force real per-request evaluation.
export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isAdminConfigured()) {
    redirect("/setup");
  }
  const loggedIn = await getSession();
  redirect(loggedIn ? "/dashboard" : "/login");
}
