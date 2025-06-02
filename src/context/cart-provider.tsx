"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  fruitId: string
  name: string
  price: number
  quantity: number
  image: string | null
  stock: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (fruitId: string) => void
  updateQuantity: (fruitId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items))
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }
  }, [items])

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.fruitId === item.fruitId)

      if (existingItem) {
        // Don't exceed stock
        const newQuantity = Math.min(existingItem.quantity + item.quantity, item.stock)

        return prevItems.map((i) => (i.fruitId === item.fruitId ? { ...i, quantity: newQuantity } : i))
      } else {
        return [...prevItems, item]
      }
    })
  }

  const removeItem = (fruitId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.fruitId !== fruitId))
  }

  const updateQuantity = (fruitId: string, quantity: number) => {
    setItems((prevItems) => prevItems.map((item) => (item.fruitId === fruitId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
