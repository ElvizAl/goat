import { requireAuth } from "@/actions/user-actions"
import { searchFruits } from "@/actions/fruit-actions"
import { FruitList } from "@/components/fruits/fruit-list"
import { FruitFilters } from "@/components/fruits/fruit-filters"
import { FruitStats } from "@/components/fruits/fruit-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: {
    query?: string
    sortBy?: string
    sortOrder?: string
    page?: string
    inStock?: string
    limit?: string
  }
}

export default async function FruitsPage({ searchParams }: PageProps) {
  await requireAuth()

  // Ensure `searchParams` are resolved
  const query = searchParams.query
  const sortBy = searchParams.sortBy as any
  const sortOrder = searchParams.sortOrder as any
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const inStock = searchParams.inStock === "true"

  const searchParams_ = {
    query,
    sortBy,
    sortOrder,
    page,
    inStock,
    limit: 10, // You can set a default limit
  }

  const fruitsResult = await searchFruits(searchParams_)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fruit Inventory</h1>
          <p className="text-gray-600">Manage your fruit products and stock</p>
        </div>
        <Button asChild>
          <Link href="/fruits/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Fruit
          </Link>
        </Button>
      </div>

      <FruitStats />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FruitFilters />
        </div>

        <div className="lg:col-span-3">
          {fruitsResult.success ? (
            <FruitList fruits={fruitsResult.data.fruits} pagination={fruitsResult.data.pagination} />
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600">{fruitsResult.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
