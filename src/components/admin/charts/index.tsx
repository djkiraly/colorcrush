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
  ReferenceLine,
} from "recharts";

// Brand palette — mirrors the COLORS tokens in globals.css
const COLORS = [
  "#F43F5E", // brand-primary
  "#581C87", // brand-secondary
  "#10B981", // brand-success
  "#F59E0B", // brand-warning
  "#7DD3FC", // brand-sky
  "#C4B5FD", // brand-lavender
  "#F9A8D4", // brand-pink
  "#FDBA74", // brand-peach
];

const TICK_COLOR = "#6B7280"; // brand-text-secondary
const GRID_COLOR = "#F3F4F6"; // muted
const TICK_FONT_SIZE = 11;

interface ChartProps {
  data: any[];
}

function formatShortDate(v: string) {
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(v: string) {
  return new Date(v).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDollar(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

function truncateLabel(label: string, maxLen = 16) {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "\u2026" : label;
}

/**
 * Compute a tick interval so we show at most ~7 labels on the XAxis.
 * Returns 0 (show every tick) when the dataset is small enough.
 */
function autoInterval(dataLength: number): number {
  if (dataLength <= 8) return 0;
  return Math.ceil(dataLength / 7) - 1;
}

// ---------------------------------------------------------------------------
// Shared margin presets
// ---------------------------------------------------------------------------

/** Standard margin for charts with a left-side numeric YAxis */
const MARGIN_STANDARD = { top: 8, right: 24, left: 0, bottom: 4 };

/** Wider left margin is NOT needed — YAxis width prop already reserves space.
 *  For horizontal bar charts (layout="vertical") we keep left=0 as well. */
const MARGIN_HORIZONTAL_BAR = { top: 8, right: 32, left: 0, bottom: 4 };

// ---------------------------------------------------------------------------
// RevenueChart
// ---------------------------------------------------------------------------

export function RevenueChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={MARGIN_STANDARD}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          fontSize={TICK_FONT_SIZE}
          interval={autoInterval(data.length)}
          tick={{ fill: TICK_COLOR }}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={formatDollar}
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
          labelFormatter={(label) => formatFullDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#F43F5E"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// OrdersChart
// ---------------------------------------------------------------------------

export function OrdersChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={MARGIN_STANDARD}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          fontSize={TICK_FONT_SIZE}
          interval={autoInterval(data.length)}
          tick={{ fill: TICK_COLOR }}
          tickMargin={8}
        />
        <YAxis
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [String(value), "Orders"]}
          labelFormatter={(label) => formatFullDate(String(label))}
        />
        <Bar dataKey="orders" fill="#581C87" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// TopProductsChart — horizontal bar, sorted by revenue descending
// ---------------------------------------------------------------------------

export function TopProductsChart({ data }: ChartProps) {
  // Sort descending so the highest-revenue product is at the top
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  // At least 300px; 40px per row gives enough breathing room for labels
  const chartHeight = Math.max(300, sorted.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={sorted} layout="vertical" margin={MARGIN_HORIZONTAL_BAR}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatDollar}
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          tickMargin={4}
        />
        <YAxis
          type="category"
          dataKey="name"
          fontSize={TICK_FONT_SIZE}
          width={130}
          tick={{ fill: TICK_COLOR }}
          tickFormatter={(v) => truncateLabel(v, 20)}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
          labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
        />
        <Bar dataKey="revenue" fill="#F43F5E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// CategoryPieChart — donut with legend; labels only on slices >= 5%
// ---------------------------------------------------------------------------

/**
 * Custom label: only renders on slices that are large enough to be legible.
 * Slices smaller than MIN_PERCENT_FOR_LABEL rely on the Legend below.
 */
const MIN_PERCENT_FOR_LABEL = 0.05;

function PieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}) {
  if (percent < MIN_PERCENT_FOR_LABEL) return null;

  const RADIAN = Math.PI / 180;
  // Position label just outside the slice
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      fontSize={10}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${truncateLabel(name, 12)} ${((percent) * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryPieChart({ data }: ChartProps) {
  return (
    // Extra height so labels above and legend below don't get clipped
    <ResponsiveContainer width="100%" height={340}>
      <PieChart margin={{ top: 16, right: 40, left: 40, bottom: 8 }}>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={58}
          outerRadius={96}
          dataKey="revenue"
          nameKey="name"
          paddingAngle={2}
          labelLine={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "2 2" }}
          label={(props: any) => (
            <PieLabel
              cx={props.cx}
              cy={props.cy}
              midAngle={props.midAngle}
              innerRadius={props.innerRadius}
              outerRadius={props.outerRadius}
              percent={props.percent ?? 0}
              name={props.name ?? ""}
            />
          )}
        >
          {data.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingTop: 12, fontSize: 11, color: TICK_COLOR }}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: TICK_COLOR }}>
              {truncateLabel(value, 22)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// InventoryChart — horizontal bar with per-bar color + threshold reference lines
// ---------------------------------------------------------------------------

const INVENTORY_LEGEND = [
  { label: "In Stock", color: "#10B981" },
  { label: "Low Stock", color: "#F59E0B" },
  { label: "Out of Stock", color: "#EF4444" },
];

export function InventoryChart({ data }: ChartProps) {
  const chartData = data.map((item: any) => ({
    ...item,
    stockColor:
      item.quantity === 0
        ? "#EF4444"
        : item.quantity <= item.threshold
        ? "#F59E0B"
        : "#10B981",
  }));

  const chartHeight = Math.max(300, chartData.length * 36);

  // Unique threshold values for reference lines (de-duped)
  const thresholds: number[] = Array.from(
    new Set(chartData.map((d: any) => d.threshold as number))
  ).filter((t) => typeof t === "number" && t > 0);

  return (
    <div>
      {/* Custom legend */}
      <div className="flex items-center gap-4 mb-2 text-xs" style={{ color: TICK_COLOR }}>
        {INVENTORY_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={MARGIN_HORIZONTAL_BAR}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
          <XAxis
            type="number"
            fontSize={TICK_FONT_SIZE}
            tick={{ fill: TICK_COLOR }}
            allowDecimals={false}
            tickMargin={4}
          />
          <YAxis
            type="category"
            dataKey="name"
            fontSize={TICK_FONT_SIZE}
            width={130}
            tick={{ fill: TICK_COLOR }}
            tickFormatter={(v) => truncateLabel(v, 20)}
          />
          <Tooltip
            formatter={(value) => [
              `${value} units`,
              "Stock",
            ]}
            labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
          />
          <Bar dataKey="quantity" name="Stock" radius={[0, 4, 4, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.stockColor} />
            ))}
          </Bar>
          {/* Render a dashed reference line for each unique threshold value */}
          {thresholds.map((t) => (
            <ReferenceLine
              key={`ref-${t}`}
              x={t}
              stroke="#EF4444"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `Min ${t}`,
                position: "insideTopRight",
                fontSize: 9,
                fill: "#EF4444",
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomerGrowthChart
// ---------------------------------------------------------------------------

export function CustomerGrowthChart({ data }: ChartProps) {
  let cumulative = 0;
  const chartData = data.map((d: any) => {
    cumulative += d.newCustomers;
    return { ...d, cumulative };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={MARGIN_STANDARD}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          fontSize={TICK_FONT_SIZE}
          interval={autoInterval(chartData.length)}
          tick={{ fill: TICK_COLOR }}
          tickMargin={8}
        />
        <YAxis
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          width={44}
          allowDecimals={false}
        />
        <Tooltip labelFormatter={(label) => formatFullDate(String(label))} />
        <Legend
          verticalAlign="top"
          height={32}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: TICK_COLOR, paddingBottom: 8 }}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: TICK_COLOR }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="newCustomers"
          name="New Customers"
          stroke="#581C87"
          fill="#C4B5FD"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Total Customers"
          stroke="#10B981"
          fill="#A7F3D0"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// AOVChart — Average Order Value
// ---------------------------------------------------------------------------

export function AOVChart({ data }: ChartProps) {
  const chartData = data
    .filter((d: any) => d.orders > 0)
    .map((d: any) => ({
      ...d,
      aov: d.revenue / d.orders,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={MARGIN_STANDARD}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          fontSize={TICK_FONT_SIZE}
          interval={autoInterval(chartData.length)}
          tick={{ fill: TICK_COLOR }}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={formatDollar}
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "AOV"]}
          labelFormatter={(label) => formatFullDate(String(label))}
        />
        <Line
          type="monotone"
          dataKey="aov"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// SalesByDayChart — fixed 7-day categorical axis, no interval needed
// ---------------------------------------------------------------------------

export function SalesByDayChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={MARGIN_STANDARD}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="day"
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          tickMargin={8}
        />
        <YAxis
          fontSize={TICK_FONT_SIZE}
          tick={{ fill: TICK_COLOR }}
          width={40}
          allowDecimals={false}
        />
        <Tooltip />
        <Bar dataKey="orders" fill="#7DD3FC" name="Orders" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
