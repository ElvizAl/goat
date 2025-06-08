"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPayment } from "@/actions/payment-actions"
import { toast } from "sonner"

interface OrderFromDB {
  id: string
  orderNumber: string
  total: number
  customer: {
    name: string
  }
}

interface PaymentFormProps {
  orders: OrderFromDB[]
}

export function PaymentForm({ orders }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      orderId: formData.get("orderId") as string,
      amountPaid: Number(formData.get("amountPaid")),
      paymentMethod: formData.get("paymentMethod") as string,
      paymentStatus: formData.get("paymentStatus") as "PENDING" | "COMPLETED" | "FAILED",
    }

    // Validasi sederhana
    const newErrors: Record<string, string> = {}
    if (!data.orderId) newErrors.orderId = "Order harus dipilih"
    if (!data.amountPaid || data.amountPaid <= 0) newErrors.amountPaid = "Jumlah pembayaran harus lebih dari 0"
    if (!data.paymentMethod) newErrors.paymentMethod = "Metode pembayaran harus dipilih"
    if (!data.paymentStatus) newErrors.paymentStatus = "Status pembayaran harus dipilih"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await createPayment(data)

      if (result.success) {
        toast.success("Pembayaran berhasil dibuat")
        router.push("/dashboard/payments")
      } else {
        toast.error(result.error || "Gagal membuat pembayaran")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Form Pembayaran</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Pilih Order</Label>
            <Select name="orderId">
              <SelectTrigger>
                <SelectValue placeholder="Pilih order..." />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    #{order.orderNumber} - {order.customer.name} ({formatCurrency(order.total)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orderId && <p className="text-sm text-red-500">{errors.orderId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Jumlah Pembayaran</Label>
            <Input
              id="amountPaid"
              name="amountPaid"
              type="number"
              placeholder="Masukkan jumlah pembayaran"
              min="0"
              step="1000"
            />
            {errors.amountPaid && <p className="text-sm text-red-500">{errors.amountPaid}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
            <Select name="paymentMethod">
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode pembayaran..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Tunai</SelectItem>
                <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Status Pembayaran</Label>
            <Select name="paymentStatus">
              <SelectTrigger>
                <SelectValue placeholder="Pilih status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentStatus && <p className="text-sm text-red-500">{errors.paymentStatus}</p>}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
