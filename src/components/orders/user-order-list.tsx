"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Package, User, CreditCard } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  payment: string
  createdAt: Date
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
  }
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
    paymentStatus: string
    paymentMethod: string
    amountPaid: number
    paymentDate: Date
    proofUrl: string | null
  }>
}

interface UserOrderDetailProps {
  order: Order
}

export function UserOrderDetail({ order }: UserOrderDetailProps) {
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
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const sendToWhatsApp = () => {
    const phoneNumber = "6281234567890" // Ganti dengan nomor WhatsApp admin

    const itemList = order.orderItems
      .map((item) => `• ${item.quantity}x ${item.fruit.name} - ${formatCurrency(item.subtotal)}`)
      .join("\n")

    const message = `
Halo Admin, saya ingin menanyakan tentang pesanan:

*Order Number:* ${order.orderNumber}
*Order ID:* ${order.id}
*Nama:* ${order.customer.name}

*Detail Pesanan:*
${itemList}

*Total:* ${formatCurrency(order.total)}
*Status:* ${order.status}

Mohon informasinya. Terima kasih!
    `.trim()

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Detail Pesanan</h1>
        <p className="text-gray-600 mt-2">#{order.orderNumber}</p>
      </div>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Status Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={getStatusColor(order.status)} variant="secondary">
                {order.status}
              </Badge>
              <p className="text-sm text-gray-500 mt-2">Dipesan pada {formatDate(order.createdAt)}</p>
            </div>
            <Button onClick={sendToWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Hubungi Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
              {order.customer.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
              {order.customer.address && <p className="text-sm text-gray-500 mt-2">{order.customer.address}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                  <Image
                    src={item.fruit.image || "/placeholder.svg?height=64&width=64"}
                    alt={item.fruit.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.fruit.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.quantity}x {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      {order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informasi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.payments.map((payment) => (
                <div key={payment.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Metode: {payment.paymentMethod}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <Badge className={getPaymentStatusColor(payment.paymentStatus)} variant="secondary">
                      {payment.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Dibayar:</span>
                    <span className="font-medium">{formatCurrency(payment.amountPaid)}</span>
                  </div>
                  {payment.proofUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Bukti Transfer:</p>
                      <Button variant="outline" size="sm" onClick={() => window.open(payment.proofUrl || "", "_blank")}>
                        Lihat Bukti Transfer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
