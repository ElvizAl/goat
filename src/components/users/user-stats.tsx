"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, UserCheck, Calendar } from "lucide-react"

interface UserStatsProps {
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string | Date
  }>
}

export function UserStats({ users }: UserStatsProps) {
  const totalUsers = users.length
  const adminUsers = users.filter((user) => user.role === "ADMIN").length
  const regularUsers = users.filter((user) => user.role === "USER").length

  // Users created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const newUsers = users.filter((user) => {
    const userDate = typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt
    return userDate >= thirtyDaysAgo
  }).length

  const stats = [
    {
      title: "Total Pengguna",
      value: totalUsers,
      icon: Users,
      description: "Semua pengguna terdaftar",
    },
    {
      title: "Admin",
      value: adminUsers,
      icon: Shield,
      description: "Pengguna dengan akses admin",
    },
    {
      title: "Pengguna Biasa",
      value: regularUsers,
      icon: UserCheck,
      description: "Pengguna dengan akses terbatas",
    },
    {
      title: "Pengguna Baru",
      value: newUsers,
      icon: Calendar,
      description: "Terdaftar dalam 30 hari terakhir",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
