"use server";

import { redirect } from "next/navigation";
import { createSession, verifyAdmin } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  const ok = await verifyAdmin(username, password);
  if (!ok) {
    redirect("/login?error=" + encodeURIComponent("Invalid username or password"));
  }

  await createSession();
  redirect("/dashboard");
}
