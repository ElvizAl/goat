import { getUserById } from "@/actions/user-actions"
import { UserDetail } from "@/components/users/user-detail"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const { data: user, error } = await getUserById(id)

  if (error || !user) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Detail Pengguna</h1>
        </div>

        <Link href={`/dashboard/users/${id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <UserDetail user={user} />
    </div>
  )
}
