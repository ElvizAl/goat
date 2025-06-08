import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const topProducts = [
  { name: "Apel Fuji", sales: 120, percentage: 85 },
  { name: "Jeruk Manis", sales: 98, percentage: 70 },
  { name: "Pisang Cavendish", sales: 87, percentage: 62 },
  { name: "Mangga Harum Manis", sales: 76, percentage: 54 },
  { name: "Anggur Hijau", sales: 65, percentage: 46 },
]

export function TopProducts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{product.name}</span>
              <span className="text-muted-foreground">{product.sales} terjual</span>
            </div>
            <Progress value={product.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
