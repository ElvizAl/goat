import { getUsers } from "@/actions/user-actions"
import { UserList } from "@/components/users/user-list"
import { UserStats } from "@/components/users/user-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function UsersPage() {
  const { data: users, error } = await getUsers()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pengguna</h1>
        <Link href="/dashboard/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </Link>
      </div>

      <UserStats users={users || []} />

      {error ? (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">Error: {error}</div>
      ) : (
        <UserList users={users || []} />
      )}
    </div>
  )
}
