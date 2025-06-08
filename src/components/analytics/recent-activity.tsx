import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    user: "John Doe",
    action: "membuat pesanan baru",
    target: "#ORD-001",
    time: "2 menit yang lalu",
    type: "order",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "melakukan pembayaran",
    target: "#PAY-002",
    time: "5 menit yang lalu",
    type: "payment",
  },
  {
    id: 3,
    user: "Admin",
    action: "menambah produk baru",
    target: "Apel Merah",
    time: "10 menit yang lalu",
    type: "product",
  },
  {
    id: 4,
    user: "Bob Wilson",
    action: "mendaftar sebagai pelanggan",
    target: "",
    time: "15 menit yang lalu",
    type: "customer",
  },
]

export function RecentActivity() {
  const getActivityBadge = (type: string) => {
    switch (type) {
      case "order":
        return <Badge className="bg-blue-100 text-blue-800">Pesanan</Badge>
      case "payment":
        return <Badge className="bg-green-100 text-green-800">Pembayaran</Badge>
      case "product":
        return <Badge className="bg-purple-100 text-purple-800">Produk</Badge>
      case "customer":
        return <Badge className="bg-orange-100 text-orange-800">Pelanggan</Badge>
      default:
        return <Badge>Aktivitas</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                  {activity.target && <span className="font-medium">{activity.target}</span>}
                </p>
                <div className="flex items-center space-x-2">
                  {getActivityBadge(activity.type)}
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
