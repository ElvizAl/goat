import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: Date
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
    paymentDate: Date
  }>
}

interface CustomerOrderHistoryProps {
  orders: Order[]
}

export function CustomerOrderHistory({ orders }: CustomerOrderHistoryProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="h-4 w-4" />
          <span>Order History</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No orders found</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{order.orderNumber}</h4>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.fruit.name}
                      </span>
                      <span>Rp {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <p className="text-sm text-gray-500">+{order.orderItems.length - 3} more items</p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">Rp {order.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
