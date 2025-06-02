"use server"

import { prisma } from "@/db/prisma"
import {
  createFruitSchema,
  updateFruitSchema,
  fruitSearchSchema,
  type CreateFruitInput,
  type UpdateFruitInput,
  type FruitSearchInput,
} from "@/validasi/validasi"
import { deleteImage } from "@/actions/image-actions"
import { revalidatePath } from "next/cache"

export async function createFruit(data: CreateFruitInput) {
  try {
    const validatedData = createFruitSchema.parse(data)

    const fruit = await prisma.fruit.create({
      data: validatedData,
    })

    revalidatePath("/fruits")
    revalidatePath("/dashboard")
    return { success: true, data: fruit }
  } catch (error) {
    console.error("Error creating fruit:", error)
    return { error: "Failed to create fruit" }
  }
}

export async function updateFruit(data: UpdateFruitInput) {
  try {
    const validatedData = updateFruitSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Get the current fruit to check if image is being changed
    const currentFruit = await prisma.fruit.findUnique({
      where: { id },
      select: { image: true },
    })

    // If image is being changed and there was an old image, delete it
    if (currentFruit?.image && updateData.image !== currentFruit.image) {
      try {
        await deleteImage(currentFruit.image)
      } catch (error) {
        console.warn("Failed to delete old image:", error)
      }
    }

    const fruit = await prisma.fruit.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/fruits")
    revalidatePath("/dashboard")
    revalidatePath(`/fruits/${id}`)
    return { success: true, data: fruit }
  } catch (error) {
    console.error("Error updating fruit:", error)
    return { error: "Failed to update fruit" }
  }
}

export async function deleteFruit(id: string) {
  try {
    // Get the fruit to check if it has an image
    const fruit = await prisma.fruit.findUnique({
      where: { id },
      select: { image: true },
    })

    // Check if fruit is used in any orders
    const orderItemCount = await prisma.orderItem.count({
      where: { fruitId: id },
    })

    if (orderItemCount > 0) {
      return { error: "Cannot delete fruit that has been ordered" }
    }

    // Delete the fruit from database
    await prisma.fruit.delete({
      where: { id },
    })

    // Delete the image if it exists
    if (fruit?.image) {
      try {
        await deleteImage(fruit.image)
      } catch (error) {
        console.warn("Failed to delete fruit image:", error)
      }
    }

    revalidatePath("/fruits")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting fruit:", error)
    return { error: "Failed to delete fruit" }
  }
}

export async function searchFruits(params: FruitSearchInput) {
  try {
    const validatedParams = fruitSearchSchema.parse(params)
    const { query, sortBy, sortOrder, page, limit, inStock } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      }
    }

    if (inStock) {
      where.stock = {
        gt: 0,
      }
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [fruits, total] = await Promise.all([
      prisma.fruit.findMany({
        where,
        include: {
          _count: {
            select: {
              orderItems: true,
              stockHistory: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.fruit.count({ where }),
    ])

    return {
      success: true,
      data: {
        fruits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("Error searching fruits:", error)
    return { error: "Failed to search fruits" }
  }
}

export async function getFruits() {
  try {
    const fruits = await prisma.fruit.findMany({
      include: {
        _count: {
          select: {
            orderItems: true,
            stockHistory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: fruits }
  } catch (error) {
    console.error("Error fetching fruits:", error)
    return { error: "Failed to fetch fruits" }
  }
}

export async function getFruitById(id: string) {
  try {
    const fruit = await prisma.fruit.findUnique({
      where: { id },
      include: {
        stockHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    })

    if (!fruit) {
      return { error: "Fruit not found" }
    }

    return { success: true, data: fruit }
  } catch (error) {
    console.error("Error fetching fruit:", error)
    return { error: "Failed to fetch fruit" }
  }
}

export async function getFruitsInStock() {
  try {
    const fruits = await prisma.fruit.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: fruits }
  } catch (error) {
    console.error("Error fetching fruits in stock:", error)
    return { error: "Failed to fetch fruits in stock" }
  }
}

export async function getFruitStats() {
  try {
    const [totalFruits, inStockFruits, lowStockFruits, outOfStockFruits, totalValue] = await Promise.all([
      prisma.fruit.count(),
      prisma.fruit.count({
        where: {
          stock: {
            gt: 0,
          },
        },
      }),
      prisma.fruit.count({
        where: {
          stock: {
            gt: 0,
            lte: 10,
          },
        },
      }),
      prisma.fruit.count({
        where: {
          stock: 0,
        },
      }),
      prisma.fruit.aggregate({
        _sum: {
          stock: true,
        },
        _avg: {
          price: true,
        },
      }),
    ])

    return {
      success: true,
      data: {
        totalFruits,
        inStockFruits,
        lowStockFruits,
        outOfStockFruits,
        totalStock: totalValue._sum.stock || 0,
        averagePrice: totalValue._avg.price || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching fruit stats:", error)
    return { error: "Failed to fetch fruit stats" }
  }
}

export async function getPopularFruits(limit = 6) {
  try {
    const popularFruits = await prisma.orderItem.groupBy({
      by: ["fruitId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    })

    const fruitsWithDetails = await Promise.all(
      popularFruits.map(async (item) => {
        const fruit = await prisma.fruit.findUnique({
          where: { id: item.fruitId },
        })

        return {
          ...fruit,
          totalSold: item._sum.quantity || 0,
        }
      }),
    )

    return { success: true, data: fruitsWithDetails.filter(Boolean) }
  } catch (error) {
    console.error("Error fetching popular fruits:", error)
    return { error: "Failed to fetch popular fruits" }
  }
}
