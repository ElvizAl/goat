"use server"

import { prisma } from "@/db/prisma"
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerSearchInput,
} from "@/validasi/validasi"
import { revalidatePath } from "next/cache"
// Tambahkan import ini di bagian atas file
import { getUserSession } from "./user-actions"

export async function createCustomer(data: CreateCustomerInput) {
  try {
    const validatedData = createCustomerSchema.parse(data)

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: validatedData.email },
      })

      if (existingCustomer) {
        return { error: "Customer with this email already exists" }
      }
    }

    const customer = await prisma.customer.create({
      data: validatedData,
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    revalidatePath("/customers")
    return { success: true, data: customer }
  } catch (error) {
    console.error("Error creating customer:", error)
    return { error: "Failed to create customer" }
  }
}

export async function updateCustomer(data: UpdateCustomerInput) {
  try {
    const validatedData = updateCustomerSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if email already exists (if provided and different from current)
    if (updateData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: updateData.email,
          NOT: { id },
        },
      })

      if (existingCustomer) {
        return { error: "Customer with this email already exists" }
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    revalidatePath("/customers")
    revalidatePath(`/customers/${id}`)
    return { success: true, data: customer }
  } catch (error) {
    console.error("Error updating customer:", error)
    return { error: "Failed to update customer" }
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Check if customer has orders
    const orderCount = await prisma.order.count({
      where: { customerId: id },
    })

    if (orderCount > 0) {
      return { error: "Cannot delete customer with existing orders" }
    }

    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath("/customers")
    return { success: true }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return { error: "Failed to delete customer" }
  }
}

export async function searchCustomers(params: CustomerSearchInput) {
  try {
    const validatedParams = customerSearchSchema.parse(params)
    const { query, sortBy, sortOrder, page, limit } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: any = {}

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ]
    }

    // Build order by clause
    let orderBy: any = {}

    if (sortBy === "totalOrders") {
      orderBy = {
        orders: {
          _count: sortOrder,
        },
      }
    } else if (sortBy === "totalSpent") {
      // This would require a more complex query with aggregation
      orderBy = { createdAt: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: { name: true },
          },
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 3, // Last 3 orders for preview
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    // Calculate total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const totalSpent = await prisma.order.aggregate({
          where: {
            customerId: customer.id,
            status: "COMPLETED",
          },
          _sum: {
            total: true,
          },
        })

        return {
          ...customer,
          totalSpent: totalSpent._sum.total || 0,
        }
      }),
    )

    return {
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("Error searching customers:", error)
    return { error: "Failed to search customers" }
  }
}

export async function getCustomers(userId?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const totalSpent = await prisma.order.aggregate({
          where: {
            customerId: customer.id,
            status: "COMPLETED",
          },
          _sum: {
            total: true,
          },
        })

        return {
          ...customer,
          totalSpent: totalSpent._sum.total || 0,
        }
      }),
    )

    return { success: true, data: customersWithStats }
  } catch (error) {
    console.error("Error fetching customers:", error)
    return { error: "Failed to fetch customers" }
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            orderItems: {
              include: {
                fruit: {
                  select: { name: true, image: true },
                },
              },
            },
            payments: true,
          },
        },
      },
    })

    if (!customer) {
      return { error: "Customer not found" }
    }

    // Calculate customer statistics
    const stats = await prisma.order.aggregate({
      where: {
        customerId: id,
        status: "COMPLETED",
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    // Get favorite products
    const favoriteProducts = await prisma.orderItem.groupBy({
      by: ["fruitId"],
      where: {
        order: {
          customerId: id,
          status: "COMPLETED",
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    })

    const favoriteProductsWithDetails = await Promise.all(
      favoriteProducts.map(async (item) => {
        const fruit = await prisma.fruit.findUnique({
          where: { id: item.fruitId },
          select: { name: true, image: true },
        })
        return {
          ...fruit,
          totalQuantity: item._sum.quantity || 0,
        }
      }),
    )

    return {
      success: true,
      data: {
        ...customer,
        stats: {
          totalSpent: stats._sum.total || 0,
          totalOrders: stats._count.id,
          averageOrderValue: stats._count.id > 0 ? (stats._sum.total || 0) / stats._count.id : 0,
        },
        favoriteProducts: favoriteProductsWithDetails,
      },
    }
  } catch (error) {
    console.error("Error fetching customer:", error)
    return { error: "Failed to fetch customer" }
  }
}

export async function getCustomerAnalytics() {
  try {
    const [totalCustomers, newCustomersThisMonth, topCustomers, customerGrowth] = await Promise.all([
      // Total customers
      prisma.customer.count(),

      // New customers this month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Top customers by total spent
      prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          c.email,
          COALESCE(SUM(o.total), 0) as total_spent,
          COUNT(o.id) as order_count
        FROM "Customer" c
        LEFT JOIN "Order" o ON c.id = o."customerId" AND o.status = 'COMPLETED'
        GROUP BY c.id, c.name, c.email
        ORDER BY total_spent DESC
        LIMIT 10
      `,

      // Customer growth over last 6 months
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM "Customer"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `,
    ])

    return {
      success: true,
      data: {
        totalCustomers,
        newCustomersThisMonth,
        topCustomers,
        customerGrowth,
      },
    }
  } catch (error) {
    console.error("Error fetching customer analytics:", error)
    return { error: "Failed to fetch customer analytics" }
  }
}

export async function getCustomerSegments() {
  try {
    const segments = await prisma.$queryRaw`
      WITH customer_stats AS (
        SELECT 
          c.id,
          c.name,
          c.email,
          COALESCE(SUM(o.total), 0) as total_spent,
          COUNT(o.id) as order_count,
          MAX(o."createdAt") as last_order_date
        FROM "Customer" c
        LEFT JOIN "Order" o ON c.id = o."customerId" AND o.status = 'COMPLETED'
        GROUP BY c.id, c.name, c.email
      )
      SELECT 
        CASE 
          WHEN total_spent >= 1000000 THEN 'VIP'
          WHEN total_spent >= 500000 THEN 'Premium'
          WHEN total_spent >= 100000 THEN 'Regular'
          ELSE 'New'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        AVG(order_count) as avg_orders
      FROM customer_stats
      GROUP BY 
        CASE 
          WHEN total_spent >= 1000000 THEN 'VIP'
          WHEN total_spent >= 500000 THEN 'Premium'
          WHEN total_spent >= 100000 THEN 'Regular'
          ELSE 'New'
        END
      ORDER BY avg_spent DESC
    `

    return { success: true, data: segments }
  } catch (error) {
    console.error("Error fetching customer segments:", error)
    return { error: "Failed to fetch customer segments" }
  }
}

// Tambahkan fungsi ini setelah fungsi getCustomerSegments

export async function createCustomerProfile(data: Omit<CreateCustomerInput, "userId">) {
  try {
    // Get current user session
    const session = await getUserSession()
    if (!session.success) {
      return { error: "User not authenticated" }
    }

    // Check if user already has a customer profile
    const existingCustomer = await prisma.customer.findFirst({
      where: { userId: session.data?.id },
    })

    if (existingCustomer) {
      return { error: "Customer profile already exists" }
    }

    const validatedData = createCustomerSchema.parse({
      ...data,
      userId: session.data?.id,
    })

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: validatedData.email },
      })

      if (existingCustomer) {
        return { error: "Customer with this email already exists" }
      }
    }

    const customer = await prisma.customer.create({
      data: validatedData,
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    revalidatePath("/profile")
    return { success: true, data: customer }
  } catch (error) {
    console.error("Error creating customer profile:", error)
    return { error: "Failed to create customer profile" }
  }
}

export async function getCurrentUserCustomer() {
  try {
    // Get current user session
    const session = await getUserSession()
    if (!session.success) {
      return { error: "User not authenticated" }
    }

    const customer = await prisma.customer.findFirst({
      where: { userId: session.data?.id },
      include: {
        user: {
          select: { name: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            orderItems: {
              include: {
                fruit: {
                  select: { name: true, image: true },
                },
              },
            },
            payments: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!customer) {
      return { error: "Customer profile not found" }
    }

    // Calculate customer statistics
    const stats = await prisma.order.aggregate({
      where: {
        customerId: customer.id,
        status: "COMPLETED",
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      success: true,
      data: {
        ...customer,
        stats: {
          totalSpent: stats._sum.total || 0,
          totalOrders: stats._count.id,
          averageOrderValue: stats._count.id > 0 ? (stats._sum.total || 0) / stats._count.id : 0,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching current user customer:", error)
    return { error: "Failed to fetch customer profile" }
  }
}
