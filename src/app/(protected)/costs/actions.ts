"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function addCostItem(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const amount = Number(formData.get("amount"));
  const interval = String(formData.get("interval") || "monthly");

  if (!name || !Number.isFinite(amount) || amount < 0) {
    redirect("/costs?error=" + encodeURIComponent("Enter a valid name and amount"));
  }

  db.prepare("INSERT INTO cost_items (name, amount, interval) VALUES (?, ?, ?)").run(
    name,
    amount,
    interval === "yearly" ? "yearly" : "monthly"
  );
  revalidatePath("/costs");
}

export async function updateCostItem(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const amount = Number(formData.get("amount"));
  const interval = String(formData.get("interval") || "monthly");

  if (!id || !name || !Number.isFinite(amount) || amount < 0) {
    redirect("/costs?error=" + encodeURIComponent("Enter a valid name and amount"));
  }

  db.prepare("UPDATE cost_items SET name = ?, amount = ?, interval = ? WHERE id = ?").run(
    name,
    amount,
    interval === "yearly" ? "yearly" : "monthly",
    id
  );
  revalidatePath("/costs");
  redirect("/costs");
}

export async function toggleCostItem(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("UPDATE cost_items SET active = 1 - active WHERE id = ?").run(id);
  revalidatePath("/costs");
}

export async function deleteCostItem(formData: FormData) {
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM cost_items WHERE id = ?").run(id);
  revalidatePath("/costs");
}
