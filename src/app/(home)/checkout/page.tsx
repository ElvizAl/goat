"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-provider"
import { useAuthContext } from "@/context/auth-provider"
import { getCustomers } from "@/actions/customer-actions"
import { createOrder } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string | null
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuthContext()
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState("")
  const [payment, setPayment] = useState("CASH")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (items.length === 0 && !success) {
      router.push("/cart")
    }

    // Load customers
    const loadCustomers = async () => {
      try {
        const result = await getCustomers()
        if (result.success) {
          setCustomers(result.data)
        }
      } catch (error) {
        console.error("Failed to load customers:", error)
      }
    }

    loadCustomers()
  }, [items.length, router, success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Convert cart items to order items
      const orderItems = items.map((item) => ({
        fruitId: item.fruitId,
        quantity: item.quantity,
        price: item.price,
      }))

      const result = await createOrder({
        customerId,
        payment: payment as any,
        userId: user.id,
        orderItems,
      })

      if (result.success) {
        setSuccess(true)
        clearCart()

        // Redirect to order details after 2 seconds
        setTimeout(() => {
          router.push(`/orders/${result.data.id}`)
        }, 2000)
      } else {
        setError(result.error ?? "error")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-500 mb-6">Your order has been placed and is being processed.</p>
            <p className="text-gray-500 mb-6">You will be redirected to the order details page shortly.</p>
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
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Select Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.email && `(${customer.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Method *</Label>
              <Select value={payment} onValueChange={setPayment} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Place Order"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
