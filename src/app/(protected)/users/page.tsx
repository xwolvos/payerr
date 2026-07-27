import Link from "next/link";
import { queryAll } from "@/lib/db";
import { User } from "@/lib/types";
import {
  addUser,
  updateUser,
  toggleUser,
  deleteUser,
  syncPlexUsers,
  syncOverseerrUsers,
  syncJellyfinUsers,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; synced?: string; edit?: string }>;
}) {
  const { error, synced, edit } = await searchParams;
  const users = queryAll<User>("SELECT * FROM users ORDER BY active DESC, name ASC");

  const editingUser = edit ? users.find((u) => u.id === Number(edit)) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Users</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Everyone sharing the cost of your server.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={syncPlexUsers}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Sync from Plex
            </button>
          </form>
          <form action={syncJellyfinUsers}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Sync from Jellyfin
            </button>
          </form>
          <form action={syncOverseerrUsers}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Sync from Overseerr
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {synced && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {synced}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">All users</h2>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {users.length === 0 && (
            <li className="px-4 py-6 text-sm text-zinc-500">No users yet.</li>
          )}
          {users.map((u) =>
            editingUser?.id === u.id ? (
              <li key={u.id} className="px-4 py-4 bg-zinc-50 dark:bg-zinc-950">
                <UserForm action={updateUser} user={u} />
              </li>
            ) : (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className={u.active ? "" : "opacity-40"}>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {u.name}{" "}
                    <span className="ml-1 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-500">
                      {u.source}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {u.email || u.external_username || "no contact info"} &middot; share:{" "}
                    {u.share_type === "fixed"
                      ? `$${u.share_value.toFixed(2)} flat`
                      : u.share_type === "weighted"
                        ? `${u.share_value}x weight`
                        : "equal"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/users?edit=${u.id}`}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Edit
                  </Link>
                  <form action={toggleUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Add user manually</h2>
        <UserForm action={addUser} />
      </div>
    </div>
  );
}

function UserForm({ action, user }: { action: (formData: FormData) => void; user?: User }) {
  return (
    <form action={action} className="space-y-3">
      {user && <input type="hidden" name="id" value={user.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" required defaultValue={user?.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" defaultValue={user?.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Plex/Jellyfin username</label>
          <input
            name="external_username"
            defaultValue={user?.external_username ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Share type</label>
          <select name="share_type" defaultValue={user?.share_type ?? "equal"} className={inputClass}>
            <option value="equal">Equal split</option>
            <option value="weighted">Weighted</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Share value{" "}
            <span className="normal-case font-normal text-zinc-400">
              (weight, or $ if fixed)
            </span>
          </label>
          <input
            name="share_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={user?.share_value ?? 1}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          {user ? "Save changes" : "Add user"}
        </button>
        {user && (
          <Link
            href="/users"
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
