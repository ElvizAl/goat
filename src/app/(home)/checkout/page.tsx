"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/context/cart-provider"
import { useAuthContext } from "@/context/auth-provider"
import { getCurrentUserCustomer } from "@/actions/customer-actions"
import { createOrder } from "@/actions/order-actions"
import { uploadPaymentProof } from "@/actions/payment-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, AlertCircle, CheckCircle, User, Copy, Upload } from "lucide-react"
import Link from "next/link"

interface CustomerData {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuthContext()
  const router = useRouter()

  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [payment, setPayment] = useState("CASH")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploadProgress, setUploadProgress] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)

  // Bank account details
  const bankAccounts = {
    BCA: "1234567890 a.n. Toko Buah Segar",
    BNI: "0987654321 a.n. Toko Buah Segar",
    Mandiri: "1122334455 a.n. Toko Buah Segar",
  }

  // E-wallet QR codes
  const ewallets = {
    GOPAY: "/placeholder.svg?height=200&width=200",
    OVO: "/placeholder.svg?height=200&width=200",
    DANA: "/placeholder.svg?height=200&width=200",
  }

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (items.length === 0 && !success) {
      router.push("/cart")
    }

    // Load current user's customer data
    const loadCustomerData = async () => {
      try {
        const result = await getCurrentUserCustomer()
        if (result.success) {
          setCustomerData(result.data)
        } else {
          // If no customer profile, redirect to profile page to create one
          setError("Please complete your customer profile before checkout")
          setTimeout(() => {
            router.push("/profile")
          }, 2000)
        }
      } catch (error) {
        console.error("Failed to load customer data:", error)
        setError("Failed to load your customer profile")
      }
    }

    loadCustomerData()
  }, [items.length, router, success])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validasi file
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Ukuran file maksimal 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar")
        return
      }

      setProofFile(file)
      setError(null)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-proof", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error("Upload error:", error)
      setError("Gagal mengupload bukti pembayaran")
      return null
    } finally {
      setUploadProgress(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Nomor rekening berhasil disalin!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  const sendToWhatsApp = (orderData: any) => {
    const phoneNumber = "6281234567890" // Ganti dengan nomor WhatsApp admin

    // Format item list
    const itemList = items
      .map((item) => `• ${item.quantity}x ${item.name} - Rp ${(item.quantity * item.price).toLocaleString()}`)
      .join("\n")

    const message = `
Halo Admin, saya telah melakukan pemesanan:

*Order Number:* ${orderData.orderNumber}
*Order ID:* ${orderData.id}
*Nama:* ${customerData?.name}

*Detail Pesanan:*
${itemList}

*Total:* Rp ${total.toLocaleString()}
*Metode Pembayaran:* ${payment}
${notes ? `*Catatan:* ${notes}` : ""}

${payment === "TRANSFER" || payment === "DIGITAL_WALLET" ? "Bukti pembayaran sudah diupload di sistem." : ""}

Mohon segera diproses. Terima kasih!
    `.trim()

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !customerData) return

    // Validasi untuk transfer bank dan e-wallet
    if ((payment === "TRANSFER" || payment === "DIGITAL_WALLET") && !proofFile && !success) {
      setError("Silakan upload bukti pembayaran terlebih dahulu")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert cart items to order items
      const orderItems = items.map((item) => ({
        fruitId: item.fruitId,
        quantity: item.quantity,
        price: item.price,
      }))

      // Create order first
      const result = await createOrder({
        customerId: customerData.id,
        payment: payment as any,
        userId: user.id,
        orderItems,
      })

      if (result.success) {
        setOrderData(result.data)
        let proofUrl = null

        // Upload bukti pembayaran jika ada
        if (proofFile && (payment === "TRANSFER" || payment === "DIGITAL_WALLET")) {
          proofUrl = await uploadFile(proofFile)

          if (proofUrl) {
            // Update payment record dengan bukti pembayaran
            const uploadResult = await uploadPaymentProof(result.data.id, proofUrl)
            if (!uploadResult.success) {
              console.error("Failed to save proof URL:", uploadResult.error)
            }
          }
        }

        setSuccess(true)
        clearCart()

        // Jangan auto redirect, biarkan user klik tombol WhatsApp atau lihat pesanan
      } else {
        setError(result.error || "Failed to create order")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (orderData) {
      sendToWhatsApp(orderData)
    }
  }

  const handleViewOrder = () => {
    if (orderData) {
      router.push(`/orders/${orderData.id}`)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Pesanan Berhasil Dibuat!</h2>
            <p className="text-gray-500 mb-4">Pesanan Anda telah dibuat dan sedang diproses.</p>
            {(payment === "TRANSFER" || payment === "DIGITAL_WALLET") && proofFile && (
              <p className="text-green-600 mb-4">✓ Bukti pembayaran berhasil diupload</p>
            )}
            <p className="text-gray-500 mb-6">Silakan hubungi admin atau lihat detail pesanan Anda.</p>
            <div className="space-y-2">
              <Button onClick={handleWhatsAppClick} className="w-full">
                Hubungi Admin via WhatsApp
              </Button>
              <Button variant="outline" onClick={handleViewOrder} className="w-full">
                Lihat Detail Pesanan
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")} className="w-full">
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{customerData.name}</h3>
                    <p className="text-sm text-gray-500">
                      {customerData.email && `${customerData.email} • `}
                      {customerData.phone || "No phone number"}
                    </p>
                    {customerData.address && <p className="text-sm text-gray-500 mt-1">{customerData.address}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>Loading customer information...</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Pesanan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan untuk pesanan Anda"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={payment} onValueChange={setPayment} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Tunai (Bayar di Tempat)</SelectItem>
                <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                <SelectItem value="DIGITAL_WALLET">E-Wallet</SelectItem>
              </SelectContent>
            </Select>

            {payment === "TRANSFER" && (
              <div className="mt-4 space-y-4">
                <Tabs defaultValue="BCA">
                  <TabsList className="w-full">
                    <TabsTrigger value="BCA" className="flex-1">
                      BCA
                    </TabsTrigger>
                    <TabsTrigger value="BNI" className="flex-1">
                      BNI
                    </TabsTrigger>
                    <TabsTrigger value="Mandiri" className="flex-1">
                      Mandiri
                    </TabsTrigger>
                  </TabsList>
                  {Object.entries(bankAccounts).map(([bank, account]) => (
                    <TabsContent key={bank} value={bank} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{account}</p>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(account.split(" ")[0])}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="proof">Upload Bukti Transfer *</Label>
                  <div className="space-y-2">
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1"
                      required
                    />
                    <p className="text-xs text-gray-500">Format: JPG, PNG, GIF. Maksimal 5MB</p>
                    {proofFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">{proofFile.name} siap diupload</span>
                      </div>
                    )}
                    {uploadProgress && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span className="text-sm text-blue-700">Mengupload bukti transfer...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment === "DIGITAL_WALLET" && (
              <div className="mt-4 space-y-4">
                <Tabs defaultValue="GOPAY">
                  <TabsList className="w-full">
                    <TabsTrigger value="GOPAY" className="flex-1">
                      GoPay
                    </TabsTrigger>
                    <TabsTrigger value="OVO" className="flex-1">
                      OVO
                    </TabsTrigger>
                    <TabsTrigger value="DANA" className="flex-1">
                      DANA
                    </TabsTrigger>
                  </TabsList>
                  {Object.entries(ewallets).map(([wallet, qrUrl]) => (
                    <TabsContent
                      key={wallet}
                      value={wallet}
                      className="p-4 border rounded-md flex flex-col items-center"
                    >
                      <div className="relative w-48 h-48 mb-2">
                        <Image
                          src={qrUrl || "/placeholder.svg"}
                          alt={`${wallet} QR Code`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-center text-sm mb-4">Scan QR code untuk membayar dengan {wallet}</p>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="ewallet-proof">Upload Bukti Pembayaran E-Wallet *</Label>
                  <div className="space-y-2">
                    <Input
                      id="ewallet-proof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Upload screenshot bukti pembayaran dari aplikasi e-wallet. Format: JPG, PNG, GIF. Maksimal 5MB
                    </p>
                    {proofFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">{proofFile.name} siap diupload</span>
                      </div>
                    )}
                    {uploadProgress && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span className="text-sm text-blue-700">Mengupload bukti pembayaran...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment === "CASH" && (
              <div className="mt-4 p-4 border rounded-md bg-yellow-50">
                <p className="text-sm">
                  Pembayaran tunai dilakukan saat pesanan diterima. Pastikan Anda memiliki uang pas untuk memudahkan
                  proses pembayaran.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.fruitId} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>Rp {(item.quantity * item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>Rp {total.toLocaleString()}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !customerData || uploadProgress}>
              {isLoading ? "Processing..." : uploadProgress ? "Uploading..." : "Place Order"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
