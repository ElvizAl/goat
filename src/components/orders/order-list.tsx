"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, X, CheckCircle } from "lucide-react"
import { updateOrder, cancelOrder } from "@/actions/order-actions"
import { useRouter } from "next/navigation"

// Interface yang sesuai dengan data dari database
interface OrderFromDB {
  id: string
  orderNumber: string
  total: number
  status: string
  payment: string
  createdAt: Date
  customer: {
    name: string
    email: string | null
  }
  user: {
    name: string
  } | null
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    fruit: {
      name: string
      image: string | null
    }
  }>
  payments: Array<{
    id: string
    amountPaid: number
    paymentStatus: string
    paymentMethod: string
  }>
  _count: {
    orderItems: number
    payments: number
  }
}

interface OrderListProps {
  orders: OrderFromDB[]
}

export function OrderList({ orders }: OrderListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id)
    const result = await updateOrder({ id, status: status as any })

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setUpdatingId(null)
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order? This will restore the stock.")) return

    setUpdatingId(id)
    const result = await cancelOrder(id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setUpdatingId(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentColor = (payment: string) => {
    switch (payment) {
      case "CASH":
        return "bg-green-100 text-green-800"
      case "TRANSFER":
        return "bg-blue-100 text-blue-800"
      case "CREDIT_CARD":
        return "bg-purple-100 text-purple-800"
      case "DIGITAL_WALLET":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {order.customer.name} • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  <Badge className={getPaymentColor(order.payment)}>{order.payment}</Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={updatingId === order.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>

                      {order.status === "PROCESSING" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "COMPLETED")}
                            disabled={updatingId === order.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancel(order.id)}
                            disabled={updatingId === order.id}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* Order Items Preview */}
                <div>
                  <p className="text-sm font-medium mb-2">Items ({order._count.orderItems})</p>
                  <div className="space-y-1">
                    {order.orderItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.fruit.name}
                        </span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <p className="text-sm text-gray-500">+{order.orderItems.length - 3} more items</p>
                    )}
                  </div>
                </div>

                {/* Payment Status */}
                {order.payments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Payment Status</p>
                    <div className="space-y-1">
                      {order.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={
                                payment.paymentStatus === "COMPLETED"
                                  ? "border-green-500 text-green-700"
                                  : payment.paymentStatus === "PENDING"
                                    ? "border-yellow-500 text-yellow-700"
                                    : "border-red-500 text-red-700"
                              }
                            >
                              {payment.paymentStatus}
                            </Badge>
                            <span>{payment.paymentMethod}</span>
                          </span>
                          <span>{formatCurrency(payment.amountPaid)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-gray-500">
                    <p>Created by: {order.user?.name || "System"}</p>
                    <p>Payments: {order._count.payments}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
