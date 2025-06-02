"use server"

import { prisma } from "@/db/prisma"
import {
  createPaymentSchema,
  updatePaymentSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
} from "@/validasi/validasi"
import { revalidatePath } from "next/cache"

export async function createPayment(data: CreatePaymentInput) {
  try {
    const validatedData = createPaymentSchema.parse(data)

    const payment = await prisma.payment.create({
      data: validatedData,
      include: {
        order: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
    })

    revalidatePath("/payments")
    return { success: true, data: payment }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { error: "Failed to create payment" }
  }
}

export async function updatePayment(data: UpdatePaymentInput) {
  try {
    const validatedData = updatePaymentSchema.parse(data)
    const { id, ...updateData } = validatedData

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
    })

    revalidatePath("/payments")
    return { success: true, data: payment }
  } catch (error) {
    console.error("Error updating payment:", error)
    return { error: "Failed to update payment" }
  }
}

export async function getPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { error: "Failed to fetch payments" }
  }
}

export async function getPaymentsByOrder(orderId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { paymentDate: "desc" },
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error("Error fetching payments for order:", error)
    return { error: "Failed to fetch payments for order" }
  }
}

export async function getPaymentSummary() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalPayments, todayPayments, pendingPayments] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          paymentStatus: "COMPLETED",
        },
        _sum: {
          amountPaid: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.payment.aggregate({
        where: {
          paymentStatus: "COMPLETED",
          paymentDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          amountPaid: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.payment.count({
        where: {
          paymentStatus: "PENDING",
        },
      }),
    ])

    return {
      success: true,
      data: {
        totalAmount: totalPayments._sum.amountPaid || 0,
        totalCount: totalPayments._count.id,
        todayAmount: todayPayments._sum.amountPaid || 0,
        todayCount: todayPayments._count.id,
        pendingCount: pendingPayments,
      },
    }
  } catch (error) {
    console.error("Error fetching payment summary:", error)
    return { error: "Failed to fetch payment summary" }
  }
}
