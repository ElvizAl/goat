import { getPaymentSummary } from "@/actions/payment-actions"
import { getOrders } from "@/actions/order-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, DollarSign, Clock, CheckCircle } from "lucide-react"

export async function OrderStats() {
  const [paymentResult, ordersResult] = await Promise.all([getPaymentSummary(), getOrders()])

  const paymentStats = paymentResult.success ? paymentResult.data : null
  const orders = ordersResult.success ? ordersResult.data : []

  const processingOrders = orders.filter((order) => order.status === "PROCESSING").length
  const completedOrders = orders.filter((order) => order.status === "COMPLETED").length
  const totalOrders = orders.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{processingOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rp {(paymentStats?.todayAmount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">{paymentStats?.todayCount || 0} payments</p>
        </CardContent>
      </Card>
    </div>
  )
}
