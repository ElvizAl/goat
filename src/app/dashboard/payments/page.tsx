import { Suspense } from "react"
import { requireAuth } from "@/actions/user-actions"
import { getPayments, getPaymentSummary } from "@/actions/payment-actions"
import { PaymentList } from "@/components/payments/payment-list"
import { PaymentStats } from "@/components/payments/payment-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function PaymentsPage() {
  await requireAuth()

  const [paymentsResult, summaryResult] = await Promise.all([getPayments(), getPaymentSummary()])

  const payments = paymentsResult.success ? paymentsResult.data : []
  const summary = summaryResult.success ? summaryResult.data : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pembayaran</h1>
          <p className="text-muted-foreground">Kelola semua pembayaran pesanan</p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pembayaran
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>{summary && <PaymentStats summary={summary} />}</Suspense>

      <Suspense fallback={<div>Loading payments...</div>}>
        <PaymentList payments={payments} />
      </Suspense>
    </div>
  )
}
