"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/context/auth-provider"
import { getOrderById } from "@/actions/order-actions"
import { UserOrderDetail } from "@/components/orders/user-order-detail"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

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

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserOrderDetailPage({ params }: PageProps) {
  const { user } = useAuthContext()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { id } = await params
        const result = await getOrderById(id)

        if (result.success) {
          // Verify that this order belongs to the current user
          if (user && result.data.customer.id) {
            setOrder(result.data)
          } else {
            setError("Pesanan tidak ditemukan atau Anda tidak memiliki akses")
          }
        } else {
          setError(result.error || "Gagal memuat detail pesanan")
        }
      } catch (err) {
        setError("Terjadi kesalahan saat memuat detail pesanan")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadOrder()
    } else {
      setError("Silakan login terlebih dahulu")
      setLoading(false)
    }
  }, [params, user])

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Silakan login terlebih dahulu untuk melihat detail pesanan.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Pesanan
            </Link>
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Pesanan
            </Link>
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Pesanan tidak ditemukan.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Pesanan
          </Link>
        </Button>
        <UserOrderDetail order={order} />
      </div>
    </div>
  )
}
