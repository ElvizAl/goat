import { requireAuth } from "@/actions/user-actions"
import { searchCustomers } from "@/actions/customer-actions"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerFilters } from "@/components/customers/customer-filter"
import { CustomerStats } from "@/components/customers/customer-stats"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: {
    query?: string
    tags?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }
}

export default async function CustomersPage({ searchParams }: PageProps) {
  await requireAuth()

  const searchParams_ = {
    query: searchParams.query,
    tags: searchParams.tags ? searchParams.tags.split(",") : undefined,
    sortBy: searchParams.sortBy as any,
    sortOrder: searchParams.sortOrder as any,
    page: searchParams.page ? Number.parseInt(searchParams.page) : 1,
    limit: 10,
  }

  const customersResult = await searchCustomers(searchParams_)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      <CustomerStats />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <CustomerFilters />
        </div>

        <div className="lg:col-span-3">
          {customersResult.success ? (
            <CustomerList customers={customersResult.data.customers} pagination={customersResult.data.pagination} />
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600">{customersResult.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
