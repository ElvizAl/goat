import { requireAuth } from "@/actions/user-actions"
import { getCustomerById } from "@/actions/customer-actions"
import { CustomerProfile } from "@/components/customers/customer-profile"
import { CustomerOrderHistory } from "@/components/customers/customer-order-history"
import { CustomerAnalytics } from "@/components/customers/customer-analytics"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  await requireAuth()

  const customerResult = await getCustomerById(params.id)

  if (!customerResult.success) {
    notFound()
  }

  const customer = customerResult.data

  const sanitizedCustomer = {
    ...customer,
    favoriteProducts: customer.favoriteProducts
      .filter(
        (p) =>
          typeof p.name === "string" &&
          p.name.trim() !== "" &&
          "totalQuantity" in p
      )
      .map((p) => ({
        name: p.name!,
        image: p.image ?? null,
        totalQuantity: p.totalQuantity,
      })),
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{sanitizedCustomer.name}</h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
        </div>

        <Button asChild>
          <Link href={`/customers/${sanitizedCustomer.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <CustomerProfile customer={sanitizedCustomer} />
          <CustomerAnalytics customer={sanitizedCustomer} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <CustomerOrderHistory orders={sanitizedCustomer.orders} />
        </div>
      </div>
    </div>
  )
}
