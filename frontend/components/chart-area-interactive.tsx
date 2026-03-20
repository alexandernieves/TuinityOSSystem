"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ChartDataPoint {
  date: string
  revenue: number
  orders: number
  customers: number
}

const chartData: ChartDataPoint[] = [
  { date: "Jan", revenue: 4000, orders: 240, customers: 2400 },
  { date: "Feb", revenue: 3000, orders: 198, customers: 2210 },
  { date: "Mar", revenue: 2000, orders: 180, customers: 2290 },
  { date: "Apr", revenue: 2780, orders: 208, customers: 2000 },
  { date: "May", revenue: 1890, orders: 130, customers: 2181 },
  { date: "Jun", revenue: 2390, orders: 180, customers: 2500 },
  { date: "Jul", revenue: 3490, orders: 280, customers: 2100 },
  { date: "Aug", revenue: 4000, orders: 320, customers: 2400 },
  { date: "Sep", revenue: 3200, orders: 240, customers: 2800 },
  { date: "Oct", revenue: 2800, orders: 190, customers: 2600 },
  { date: "Nov", revenue: 3900, orders: 310, customers: 3200 },
  { date: "Dec", revenue: 4500, orders: 380, customers: 3500 },
]

type MetricType = 'revenue' | 'orders' | 'customers'

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("6m")
  const [metric, setMetric] = React.useState<MetricType>("revenue")

  const filteredData = React.useMemo(() => {
    const months = timeRange === "1m" ? 1 : timeRange === "3m" ? 3 : 6
    return chartData.slice(-months)
  }, [timeRange])

  const currentData = filteredData[filteredData.length - 1]
  const previousData = filteredData[filteredData.length - 2]
  const change = React.useMemo(() => {
    if (!previousData || !currentData) return 0
    const current = currentData[metric]
    const previous = previousData[metric]
    return ((current - previous) / previous) * 100
  }, [currentData, previousData, metric])

  const currentValue = currentData ? currentData[metric] : 0

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {metric === "revenue" ? "Revenue" : metric === "orders" ? "Orders" : "Customers"}
          </CardTitle>
          <CardDescription>
            Showing data for the last {timeRange === "1m" ? "month" : timeRange === "3m" ? "3 months" : "6 months"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1M</SelectItem>
              <SelectItem value="3m">3M</SelectItem>
              <SelectItem value="6m">6M</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="flex items-center space-x-4 pb-4">
          <div>
            <p className="text-2xl font-bold">
              ${currentValue.toLocaleString()}
            </p>
            <p className="flex items-center text-sm">
              {change > 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  +{change.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <TrendingDown className="mr-1 h-4 w-4" />
                  {change.toFixed(1)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">vs last period</span>
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric}: ${payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={metric === "revenue" ? "#2563EB" : metric === "orders" ? "#10B981" : "#F59E0B"}
                fillOpacity={1}
                fill={`url(#color${metric.charAt(0).toUpperCase() + metric.slice(1)})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
