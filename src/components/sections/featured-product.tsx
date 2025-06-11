import { getFruits } from "@/actions/fruit-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { AddToCartButton } from "../fruits/cart-button"

export default async function FeaturedProducts() {
  // Fetch 4 featured products
  const result = await getFruits()

  // Handle error case
  if (!result.success || !result.data) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Produk Unggulan</h2>
            <p className="text-gray-600">Pilihan terbaik buah segar untuk Anda</p>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada produk yang tersedia saat ini.</p>
          </div>
        </div>
      </section>
    )
  }

  // Get first 4 fruits
  const fruits = result.data.slice(0, 4)

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Produk Unggulan</h2>
          <p className="text-gray-600">Pilihan terbaik buah segar untuk Anda</p>
        </div>

        {fruits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada produk yang tersedia saat ini.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fruits.map((fruit) => (
                <Card key={fruit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={fruit.image || "/placeholder.svg?height=200&width=200"}
                        alt={fruit.name}
                        fill
                        className="object-cover"
                      />
                      {fruit.stock <= 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Habis
                        </div>
                      )}
                      {fruit.stock > 0 && fruit.stock <= 5 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Stok Terbatas
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Link href={`/produk/${fruit.id}`} className="hover:underline">
                      <h3 className="font-semibold text-lg mb-1">{fruit.name}</h3>
                    </Link>
                    <p className="text-green-600 font-bold">{formatCurrency(fruit.price)}</p>
                    <p className="text-sm text-gray-500 mt-1">Stok: {fruit.stock}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Link href={`/produk/${fruit.id}`}>
                      <Button variant="outline" size="sm">
                        Detail
                      </Button>
                    </Link>
                    <AddToCartButton fruit={fruit} disabled={fruit.stock <= 0} />
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/produk">
                <Button variant="outline" className="gap-2">
                  Lihat Semua Produk
                  <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
