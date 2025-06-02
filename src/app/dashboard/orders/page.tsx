import { requireAuth } from "@/actions/user-actions"
import { getOrders } from "@/actions/order-actions"
import { OrderList } from "@/components/orders/order-list"
import { OrderFilters } from "@/components/orders/order-filters"
import { OrderStats } from "@/components/orders/order-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: {
    status?: string
    payment?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }
}

export default async function OrdersPage({ searchParams }: PageProps) {
  await requireAuth()

  const ordersResult = await getOrders()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and payments</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      <OrderStats />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <OrderFilters />
        </div>

        <div className="lg:col-span-3">
          {ordersResult.success ? (
            <OrderList orders={ordersResult.data} />
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600">{ordersResult.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
