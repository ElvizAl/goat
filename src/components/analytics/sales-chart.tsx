"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jan", sales: 4000000 },
  { name: "Feb", sales: 3000000 },
  { name: "Mar", sales: 5000000 },
  { name: "Apr", sales: 4500000 },
  { name: "Mei", sales: 6000000 },
  { name: "Jun", sales: 5500000 },
  { name: "Jul", sales: 7000000 },
]

export function SalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Penjualan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
            <Tooltip formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Penjualan"]} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
