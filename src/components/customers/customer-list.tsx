"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { deleteCustomer } from "@/actions/customer-actions"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  totalSpent: number
  _count: {
    orders: number
  }
  orders: Array<{
    id: string
    total: number
    status: string
    createdAt: Date
  }>
}

interface CustomerListProps {
  customers: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function CustomerList({ customers, pagination }: CustomerListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    setDeletingId(id)
    const result = await deleteCustomer(id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const getCustomerSegment = (totalSpent: number) => {
    if (totalSpent >= 1000000)
      return { label: "VIP", color: "bg-purple-100 text-purple-800" }
    if (totalSpent >= 500000)
      return { label: "Premium", color: "bg-blue-100 text-blue-800" }
    if (totalSpent >= 100000)
      return { label: "Regular", color: "bg-green-100 text-green-800" }
    return { label: "New", color: "bg-gray-100 text-gray-800" }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => {
          const segment = getCustomerSegment(customer.totalSpent)
          const lastOrder = customer.orders[0]

          return (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <Badge className={segment.color}>{segment.label}</Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/pelanggan/${customer.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/pelanggan/${customer.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(customer.id)}
                        disabled={deletingId === customer.id}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {customer.email}
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {customer.address}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-semibold">
                      Rp {customer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-semibold">{customer._count.orders}</p>
                  </div>
                </div>

                {lastOrder && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">Last Order</p>
                    <p className="text-sm">
                      Rp {lastOrder.total.toLocaleString()} •{" "}
                      {new Date(lastOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs text-gray-500">Customer Since</p>
                  <p className="text-sm">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/dashboard/pelanggan?page=${page}`}>{page}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
