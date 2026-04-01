"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#F43F5E", "#581C87", "#10B981", "#F59E0B", "#7DD3FC", "#C4B5FD", "#F9A8D4", "#FDBA74"];

interface ChartProps {
  data: any[];
}

export function RevenueChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          fontSize={12}
        />
        <YAxis tickFormatter={(v) => `$${v}`} fontSize={12} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line type="monotone" dataKey="revenue" stroke="#F43F5E" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip
          formatter={(value) => [String(value), "Orders"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Bar dataKey="orders" fill="#581C87" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
        <YAxis type="category" dataKey="name" fontSize={11} width={80} tick={{ fill: "#6B7280" }} />
        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
        <Bar dataKey="revenue" fill="#F43F5E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="revenue"
          nameKey="name"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InventoryChart({ data }: ChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill:
      item.quantity === 0
        ? "#EF4444"
        : item.quantity <= item.threshold
        ? "#F59E0B"
        : "#10B981",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" fontSize={12} />
        <YAxis type="category" dataKey="name" fontSize={11} width={80} tick={{ fill: "#6B7280" }} />
        <Tooltip />
        <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
        <Bar dataKey="threshold" fill="none" stroke="#EF4444" strokeDasharray="3 3" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CustomerGrowthChart({ data }: ChartProps) {
  let cumulative = 0;
  const chartData = data.map((d) => {
    cumulative += d.newCustomers;
    return { ...d, cumulative };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
        <Area type="monotone" dataKey="newCustomers" stroke="#581C87" fill="#C4B5FD" fillOpacity={0.3} />
        <Area type="monotone" dataKey="cumulative" stroke="#10B981" fill="#A7F3D0" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AOVChart({ data }: ChartProps) {
  const chartData = data
    .filter((d) => d.orders > 0)
    .map((d) => ({
      ...d,
      aov: d.revenue / d.orders,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          fontSize={12}
        />
        <YAxis tickFormatter={(v) => `$${v}`} fontSize={12} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "AOV"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line type="monotone" dataKey="aov" stroke="#F59E0B" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SalesByDayChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Bar dataKey="orders" fill="#7DD3FC" name="Orders" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
