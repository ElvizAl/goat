"use server"

import { prisma } from "@/db/prisma"
import { createOrderSchema, updateOrderSchema, type CreateOrderInput, type UpdateOrderInput } from "@/validasi/validasi"
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

      // Automatically create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amountPaid: total,
          paymentStatus: "PENDING",
          paymentMethod: validatedData.payment,
          paymentDate: new Date(),
        },
      })

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

      // Update related payments to FAILED (not CANCELLED)
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { paymentStatus: "FAILED" },
      })

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

interface GetOrdersParams {
  query?: string
  status?: string
  payment?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  userId?: string
}

export async function getOrders(params?: GetOrdersParams) {
  try {
    const {
      query = "",
      status = "",
      payment = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      userId,
    } = params || {}

    // Build where clause
    const where: any = {}

    // Filter by userId if provided
    if (userId) {
      where.userId = userId
    }

    // Search by order number or customer name
    if (query) {
      where.OR = [
        {
          orderNumber: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          customer: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      ]
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status
    }

    // Filter by payment method
    if (payment && payment !== "all") {
      where.payment = payment
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder
    } else if (sortBy === "total") {
      orderBy.total = sortOrder
    } else if (sortBy === "orderNumber") {
      orderBy.orderNumber = sortOrder
    } else {
      orderBy.createdAt = "desc"
    }

    const orders = await prisma.order.findMany({
      where,
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
        payments: true,
        _count: {
          select: {
            orderItems: true,
            payments: true,
          },
        },
      },
      orderBy,
      // Add pagination if needed
      // skip: (page - 1) * 10,
      // take: 10,
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

export async function getOrderSummary() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [totalOrders, todayOrders, thisMonthOrders, statusCounts] = await Promise.all([
      // Total orders
      prisma.order.aggregate({
        _count: { id: true },
        _sum: { total: true },
      }),

      // Today's orders
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),

      // This month's orders
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalCount: totalOrders._count.id,
        totalAmount: totalOrders._sum.total || 0,
        todayCount: todayOrders._count.id,
        todayAmount: todayOrders._sum.total || 0,
        thisMonthCount: thisMonthOrders._count.id,
        thisMonthAmount: thisMonthOrders._sum.total || 0,
        statusBreakdown: statusCounts.reduce(
          (acc, item) => {
            acc[item.status] = item._count.id
            return acc
          },
          {} as Record<string, number>,
        ),
      },
    }
  } catch (error) {
    console.error("Error fetching order summary:", error)
    return { error: "Failed to fetch order summary" }
  }
}
