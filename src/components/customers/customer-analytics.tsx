import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ShoppingCart, DollarSign, Target } from "lucide-react"

interface CustomerAnalyticsProps {
  customer: {
    stats: {
      totalSpent: number
      totalOrders: number
      averageOrderValue: number
    }
  }
}

export function CustomerAnalytics({ customer }: CustomerAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Customer Analytics</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Spent</span>
            </div>
            <span className="font-bold text-green-600">Rp {customer.stats.totalSpent.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <span className="font-bold text-blue-600">{customer.stats.totalOrders}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Order Value</span>
            </div>
            <span className="font-bold text-purple-600">Rp {customer.stats.averageOrderValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="border-t pt-4">
          <p className="font-medium mb-2">Customer Insights</p>
          <div className="space-y-2 text-sm text-gray-600">
            {customer.stats.totalOrders > 10 && <p>• Loyal customer with {customer.stats.totalOrders} orders</p>}
            {customer.stats.averageOrderValue > 100000 && <p>• High-value customer with large order sizes</p>}
            {customer.stats.totalSpent > 1000000 && <p>• VIP customer - consider special offers</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
