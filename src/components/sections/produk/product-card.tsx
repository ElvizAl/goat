"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-provider"
import { ShoppingBag, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
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

export default function ProductCardWithClient({ fruits }: ShopFruitListProps) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {fruits.map((fruit) => {
                const stockStatus = getStockStatus(fruit.stock)

                return (
                    <div
                        key={fruit.id}
                        className="bg-background rounded-md overflow-hidden h-[280px] flex flex-col border shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="relative flex h-40 w-full items-center justify-center text-center">
                            <Image
                                src={fruit.image || "/placeholder.svg"}
                                alt={fruit.name}
                                width={100}
                                height={80}
                                style={{ width: 'auto', height: 'auto' }}
                            />
                            {fruit.stock <= 5 && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    Stok Terbatas
                                </span>
                            )}
                        </div>
                        <div className="p-3 flex flex-col flex-1 justify-between">
                            <div>
                                <h3 className="font-medium text-base line-clamp-1">{fruit.name}</h3>
                                <div className="flex justify-between items-center">
                                    <p className="text-green-600 font-medium text-sm">{fruit.price}</p>
                                    <p className="text-xs text-muted-foreground">Stok: {fruit.stock}</p>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-2"
                                size="sm"
                                variant={fruit.stock === 0 ? "secondary" : "outline"}
                                onClick={() => handleAddToCart(fruit)}
                                disabled={fruit.stock === 0}
                            >
                                {fruit.stock === 0 ? (
                                    <>
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        <span className="text-xs">Stok Habis</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        <span className="text-xs">Tambah</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
