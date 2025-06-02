"use server"

import { prisma } from "@/db/prisma"
import {
  createOrderSchema,
  updateOrderSchema,
  type CreateOrderInput,
  type UpdateOrderInput,
} from "@/validasi/validasi"
import { revalidatePath } from "next/cache"

export async function createOrder(data: CreateOrderInput) {
  try {
    const validatedData = createOrderSchema.parse(data)

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculate total
    const total = validatedData.orderItems.reduce((sum, item) => {
      return sum + item.quantity * item.price
    }, 0)

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: validatedData.customerId,
          payment: validatedData.payment,
          total,
          userId: validatedData.userId,
        },
      })

      // Create order items and update stock
      for (const item of validatedData.orderItems) {
        // Check if fruit has enough stock
        const fruit = await tx.fruit.findUnique({
          where: { id: item.fruitId },
        })

        if (!fruit || fruit.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${fruit?.name || "fruit"}`)
        }

        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            fruitId: item.fruitId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          },
        })

        // Update fruit stock
        await tx.fruit.update({
          where: { id: item.fruitId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

        // Create stock history
        await tx.stockHistory.create({
          data: {
            fruitId: item.fruitId,
            quantity: -item.quantity,
            movementType: "out",
            description: `Order ${orderNumber}`,
            userId: validatedData.userId,
          },
        })
      }

      return newOrder
    })

    revalidatePath("/orders")
    return { success: true, data: order }
  } catch (error) {
    console.error("Error creating order:", error)
    return { error: error instanceof Error ? error.message : "Failed to create order" }
  }
}

export async function updateOrder(data: UpdateOrderInput) {
  try {
    const validatedData = updateOrderSchema.parse(data)
    const { id, ...updateData } = validatedData

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        orderItems: {
          include: {
            fruit: true,
          },
        },
      },
    })

    revalidatePath("/orders")
    return { success: true, data: order }
  } catch (error) {
    console.error("Error updating order:", error)
    return { error: "Failed to update order" }
  }
}

export async function cancelOrder(id: string) {
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Get order with items
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          orderItems: true,
        },
      })

      if (!existingOrder) {
        throw new Error("Order not found")
      }

      if (existingOrder.status === "CANCELLED") {
        throw new Error("Order is already cancelled")
      }

      // Restore stock for each item
      for (const item of existingOrder.orderItems) {
        await tx.fruit.update({
          where: { id: item.fruitId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })

        // Create stock history
        await tx.stockHistory.create({
          data: {
            fruitId: item.fruitId,
            quantity: item.quantity,
            movementType: "in",
            description: `Order ${existingOrder.orderNumber} cancelled`,
          },
        })
      }

      // Update order status
      return await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
    })

    revalidatePath("/orders")
    return { success: true, data: order }
  } catch (error) {
    console.error("Error cancelling order:", error)
    return { error: error instanceof Error ? error.message : "Failed to cancel order" }
  }
}

export async function getOrders(userId?: string) {
  try {
    const orders = await prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        customer: true,
        user: {
          select: { name: true },
        },
        orderItems: {
          include: {
            fruit: {
              select: { name: true, image: true },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { error: "Failed to fetch orders" }
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: { name: true },
        },
        orderItems: {
          include: {
            fruit: true,
          },
        },
        payments: true,
      },
    })

    if (!order) {
      return { error: "Order not found" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { error: "Failed to fetch order" }
  }
}
