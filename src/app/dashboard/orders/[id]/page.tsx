import { requireAuth } from "@/actions/user-actions"
import { getOrderById } from "@/actions/order-actions"
import { OrderDetail } from "@/components/orders/order-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  await requireAuth()

  const orderResult = await getOrderById(params.id)

  if (!orderResult.success) {
    notFound()
  }

  const order = orderResult.data

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-gray-600">Order Details</p>
        </div>
      </div>

      <OrderDetail order={order} />
    </div>
  )
}
