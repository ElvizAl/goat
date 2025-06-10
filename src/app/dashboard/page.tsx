import { Suspense } from "react"
import { requireAuth } from "@/actions/user-actions"
import { getPaymentSummary } from "@/actions/payment-actions"
import { getOrderSummary } from "@/actions/order-actions"
import { getCustomerSummary } from "@/actions/customer-actions"
import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import { SalesChart } from "@/components/analytics/sales-chart"
import { TopProducts } from "@/components/analytics/top-products"
import { RecentActivity } from "@/components/analytics/recent-activity"

export default async function AnalyticsPage() {
  await requireAuth()

  const [paymentSummary, orderSummary, customerSummary] = await Promise.all([
    getPaymentSummary(),
    getOrderSummary(),
    getCustomerSummary(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Analisis performa bisnis Anda</p>
      </div>

      <Suspense fallback={<div>Loading overview...</div>}>
        <AnalyticsOverview
          paymentSummary={paymentSummary.success ? paymentSummary.data : null}
          orderSummary={orderSummary.success ? orderSummary.data : null}
          customerSummary={customerSummary.success ? customerSummary.data : null}
        />
      </Suspense>
    </div>
  )
}
