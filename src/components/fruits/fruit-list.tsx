"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import { deleteFruit } from "@/actions/fruit-actions"
import { useRouter } from "next/navigation"

interface Fruit {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
  createdAt: Date
  _count: {
    orderItems: number
    stockHistory: number
  }
}

interface FruitListProps {
  fruits: Fruit[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function FruitList({ fruits, pagination }: FruitListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fruit?")) return

    setDeletingId(id)
    const result = await deleteFruit(id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (stock <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "In Stock", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fruits.map((fruit) => {
          const stockStatus = getStockStatus(fruit.stock)

          return (
            <Card key={fruit.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {fruit.image ? (
                        <Image src={fruit.image || "/placeholder.svg"} alt={fruit.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{fruit.name}</CardTitle>
                      <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
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
                        <Link href={`/fruits/${fruit.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/fruits/${fruit.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(fruit.id)}
                        disabled={deletingId === fruit.id}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-semibold">Rp {fruit.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className="font-semibold flex items-center">
                      {fruit.stock}
                      {fruit.stock <= 10 && fruit.stock > 0 && (
                        <AlertTriangle className="h-3 w-3 ml-1 text-yellow-600" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-semibold">{fruit._count.orderItems}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock Changes</p>
                    <p className="font-semibold">{fruit._count.stockHistory}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500">Added</p>
                  <p className="text-sm">{new Date(fruit.createdAt).toLocaleDateString()}</p>
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
            <Button key={page} variant={page === pagination.page ? "default" : "outline"} size="sm" asChild>
              <Link href={`?page=${page}`}>{page}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
