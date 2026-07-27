"use server";

import { redirect } from "next/navigation";
import { createAdmin, createSession, isAdminConfigured } from "@/lib/auth";

export async function setupAdmin(formData: FormData) {
  if (isAdminConfigured()) {
    redirect("/login");
  }

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!username || !password) {
    redirect("/setup?error=" + encodeURIComponent("Username and password are required"));
  }
  if (password.length < 8) {
    redirect("/setup?error=" + encodeURIComponent("Password must be at least 8 characters"));
  }
  if (password !== confirm) {
    redirect("/setup?error=" + encodeURIComponent("Passwords do not match"));
  }

  await createAdmin(username, password);
  await createSession();
  redirect("/dashboard");
}
