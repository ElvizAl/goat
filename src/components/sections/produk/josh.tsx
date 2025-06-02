"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/components/cart/cart-provider"
import { Package, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"

interface Fruit {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
}

interface ShopFruitListProps {
  fruits: Fruit[]
}

export function ShopFruitList({ fruits }: ShopFruitListProps) {
  const { addItem } = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(fruits.map((fruit) => [fruit.id, 1])),
  )
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})

  const handleQuantityChange = (fruitId: string, value: number) => {
    const fruit = fruits.find((f) => f.id === fruitId)
    if (!fruit) return

    // Ensure quantity is between 1 and stock
    const quantity = Math.max(1, Math.min(value, fruit.stock))
    setQuantities((prev) => ({ ...prev, [fruitId]: quantity }))
  }

  const handleAddToCart = (fruit: Fruit) => {
    const quantity = quantities[fruit.id] || 1

    addItem({
      fruitId: fruit.id,
      name: fruit.name,
      price: fruit.price,
      quantity,
      image: fruit.image,
      stock: fruit.stock,
    })

    // Show success animation
    setAddedItems((prev) => ({ ...prev, [fruit.id]: true }))
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [fruit.id]: false }))
    }, 1500)

    toast.success("ditambahkan ke keranjang")
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (stock <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "In Stock", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {fruits.map((fruit) => {
        const stockStatus = getStockStatus(fruit.stock)
        const isOutOfStock = fruit.stock === 0
        const isAdded = addedItems[fruit.id]

        return (
          <Card key={fruit.id} className="overflow-hidden">
            <div className="relative h-48 w-full bg-gray-100">
              {fruit.image ? (
                <Image src={fruit.image || "/placeholder.svg"} alt={fruit.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{fruit.name}</h3>
                <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
              </div>

              <p className="text-xl font-bold text-green-600 mb-2">Rp {fruit.price.toLocaleString()}</p>

              <p className="text-sm text-gray-500">Available: {fruit.stock} units</p>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={fruit.stock}
                  value={quantities[fruit.id] || 1}
                  onChange={(e) => handleQuantityChange(fruit.id, Number.parseInt(e.target.value) || 1)}
                  disabled={isOutOfStock}
                  className="w-20"
                />
                <Button onClick={() => handleAddToCart(fruit)} disabled={isOutOfStock || isAdded} className="flex-1">
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
