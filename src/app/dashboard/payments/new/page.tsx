import { requireAuth } from "@/actions/user-actions"
import { getOrders } from "@/actions/order-actions"
import { PaymentForm } from "@/components/payments/payment-form"

export default async function NewPaymentPage() {
  await requireAuth()

  const ordersResult = await getOrders()
  const orders = ordersResult.success ? ordersResult.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Pembayaran</h1>
        <p className="text-muted-foreground">Buat pembayaran baru untuk pesanan</p>
      </div>

      <PaymentForm orders={orders} />
    </div>
  )
}
