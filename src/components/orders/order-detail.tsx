"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateOrder, cancelOrder } from "@/actions/order-actions"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Calendar, Package, CheckCircle, X, DollarSign } from "lucide-react"

interface OrderDetailProps {
  order: {
    id: string
    orderNumber: string
    total: number
    status: string
    payment: string
    createdAt: Date
    customer: {
      name: string
      email: string | null
      phone: string | null
      address: string | null
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
        id: string
        name: string
        image: string | null
      }
    }>
    payments: Array<{
      id: string
      amountPaid: number
      paymentStatus: string
      paymentDate: Date
    }>
  }
}

export function OrderDetail({ order }: OrderDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true)
    const result = await updateOrder({ id: order.id, status: status as any })

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsUpdating(false)
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order? This will restore the stock.")) return

    setIsUpdating(true)
    const result = await cancelOrder(order.id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsUpdating(false)
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

  const totalPaid = order.payments
    .filter((p) => p.paymentStatus === "COMPLETED")
    .reduce((sum, p) => sum + p.amountPaid, 0)

  const remainingAmount = order.total - totalPaid

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Order Items */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Order Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {item.fruit.image ? (
                      <Image
                        src={item.fruit.image || "/placeholder.svg"}
                        alt={item.fruit.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium">{item.fruit.name}</h4>
                    <p className="text-sm text-gray-500">
                      Rp {item.price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">Rp {item.subtotal.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>Rp {order.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Payment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.payments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Rp {payment.amountPaid.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={payment.paymentStatus === "COMPLETED" ? "default" : "destructive"}>
                      {payment.paymentStatus}
                    </Badge>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-semibold text-green-600">Rp {totalPaid.toLocaleString()}</span>
                  </div>
                  {remainingAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-semibold text-red-600">Rp {remainingAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Order Info & Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method</span>
              <Badge className={getPaymentColor(order.payment)}>{order.payment}</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {order.user && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Created by</p>
                  <p className="text-sm text-gray-500">{order.user.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{order.customer.name}</p>
            </div>

            {order.customer.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm">{order.customer.email}</p>
              </div>
            )}

            {order.customer.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm">{order.customer.phone}</p>
              </div>
            )}

            {order.customer.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm">{order.customer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {order.status === "PROCESSING" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => handleStatusUpdate("COMPLETED")} disabled={isUpdating} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>

              <Button onClick={handleCancel} disabled={isUpdating} variant="destructive" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
