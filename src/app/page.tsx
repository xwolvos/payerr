import { redirect } from "next/navigation";
import { isAdminConfigured, getSession } from "@/lib/auth";

export default async function Home() {
  if (!isAdminConfigured()) {
    redirect("/setup");
  }
  const loggedIn = await getSession();
  redirect(loggedIn ? "/dashboard" : "/login");
}
