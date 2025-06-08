import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Clock, CheckCircle } from "lucide-react"

interface PaymentSummary {
  totalAmount: number
  totalCount: number
  todayAmount: number
  todayCount: number
  pendingCount: number
}

interface PaymentStatsProps {
  summary: PaymentSummary
}

export function PaymentStats({ summary }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">{summary.totalCount} transaksi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.todayAmount)}</div>
          <p className="text-xs text-muted-foreground">{summary.todayCount} transaksi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.pendingCount}</div>
          <p className="text-xs text-muted-foreground">Menunggu konfirmasi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tingkat Sukses</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.totalCount > 0
              ? Math.round(((summary.totalCount - summary.pendingCount) / summary.totalCount) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-muted-foreground">Pembayaran berhasil</p>
        </CardContent>
      </Card>
    </div>
  )
}
