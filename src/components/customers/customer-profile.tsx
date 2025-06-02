"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, Calendar } from "lucide-react"

interface CustomerProfileProps {
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    createdAt: Date
    stats: {
      totalSpent: number
      totalOrders: number
      averageOrderValue: number
    }
    favoriteProducts: Array<{
      name: string
      image: string | null
      totalQuantity: number
    }>
  }
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getCustomerSegment = (totalSpent: number) => {
    if (totalSpent >= 1000000) return { label: "VIP", color: "bg-purple-100 text-purple-800" }
    if (totalSpent >= 500000) return { label: "Premium", color: "bg-blue-100 text-blue-800" }
    if (totalSpent >= 100000) return { label: "Regular", color: "bg-green-100 text-green-800" }
    return { label: "New", color: "bg-gray-100 text-gray-800" }
  }

  const segment = getCustomerSegment(customer.stats.totalSpent)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{customer.name}</CardTitle>
            <Badge className={segment.color}>{segment.label}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {customer.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{customer.address}</span>
            </div>
          )}
        </div>

        {customer.favoriteProducts.length > 0 && (
          <div className="border-t pt-4">
            <p className="font-medium mb-2">Favorite Products</p>
            <div className="space-y-2">
              {customer.favoriteProducts.slice(0, 3).map((product) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <span>{product.name}</span>
                  <span className="text-gray-500">{product.totalQuantity}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Customer since {new Date(customer.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
