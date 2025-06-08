"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

interface UserDetailProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string | Date
    updatedAt: string | Date
  }
}

export function UserDetail({ user }: UserDetailProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengguna</CardTitle>
          <CardDescription>Detail lengkap pengguna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-10 w-10" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-2xl font-semibold">{user.name}</h3>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="flex justify-center sm:justify-start">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">ID Pengguna</div>
              <div className="font-mono text-sm">{user.id}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Peran</div>
              <div>{user.role}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</div>
              <div>{formatDate(user.createdAt)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</div>
              <div>{formatDate(user.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
