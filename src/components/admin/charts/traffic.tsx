"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Shared constants — must mirror index.tsx exactly for visual consistency
// ---------------------------------------------------------------------------

/** Brand palette matching the tokens defined in globals.css */
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

/** Standard margin for charts with a left-side numeric YAxis */
const MARGIN = { top: 8, right: 24, left: 0, bottom: 4 };

/** Wider right margin for horizontal bar charts */
const MARGIN_HORIZONTAL_BAR = { top: 8, right: 32, left: 0, bottom: 4 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShortDate(v: string) {
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(v: string) {
  return new Date(v).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function autoInterval(dataLength: number): number {
  if (dataLength <= 8) return 0;
  return Math.ceil(dataLength / 7) - 1;
}

function truncateLabel(label: string, maxLen = 16) {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "\u2026" : label;
}

interface ChartProps {
  data: any[];
}

// ---------------------------------------------------------------------------
// Page Views Over Time — area chart with page views + unique visitors
// ---------------------------------------------------------------------------

export function PageViewsChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={MARGIN}>
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
          width={48}
          allowDecimals={false}
        />
        <Tooltip
          labelFormatter={(label) => formatFullDate(String(label))}
          contentStyle={{ fontSize: 12 }}
        />
        {/* 36px height gives the legend room; without it the chart area is crowded */}
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingBottom: 4, fontSize: 11 }}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: TICK_COLOR }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="views"
          name="Page Views"
          stroke="#F43F5E"
          fill="#F43F5E"
          fillOpacity={0.12}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="uniqueVisitors"
          name="Unique Visitors"
          stroke="#581C87"
          fill="#C4B5FD"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Top Pages — horizontal bar chart
// YAxis width is 160px to comfortably display truncated paths
// ---------------------------------------------------------------------------

export function TopPagesChart({ data }: ChartProps) {
  // 40px per row (matches index.tsx TopProductsChart convention)
  const chartHeight = Math.max(300, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={MARGIN_HORIZONTAL_BAR}
      >
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
          dataKey="path"
          fontSize={TICK_FONT_SIZE}
          // 160px gives enough room for typical /product/slug paths
          width={160}
          tick={{ fill: TICK_COLOR }}
          tickFormatter={(v) => truncateLabel(v, 26)}
        />
        <Tooltip
          labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="views" name="Views" fill="#F43F5E" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Product Views — horizontal bar chart
// ---------------------------------------------------------------------------

export function ProductViewsChart({ data }: ChartProps) {
  const chartHeight = Math.max(260, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={MARGIN_HORIZONTAL_BAR}
      >
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
          labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="views" name="Views" fill="#581C87" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Browser / OS / Device donut charts
//
// Label strategy: mirror CategoryPieChart in index.tsx — use a proper
// positioned label component so text doesn't clip inside the SVG viewport.
// Slices < 4% are suppressed and rely on the bottom legend.
// ---------------------------------------------------------------------------

const MIN_PERCENT_FOR_LABEL = 0.04;

function DonutPieLabel({
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
  // Position label 20px beyond the outer edge of the slice
  const radius = outerRadius + 20;
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
      {`${truncateLabel(name ?? "", 12)} ${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

export function DonutChart({
  data,
  nameKey = "name",
  dataKey = "count",
}: {
  data: any[];
  nameKey?: string;
  dataKey?: string;
}) {
  const total = data.reduce((sum, d) => sum + Number(d[dataKey]), 0);

  return (
    // Extra height + horizontal margin so labels outside the ring don't clip
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 12, right: 36, left: 36, bottom: 8 }}>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={52}
          outerRadius={82}
          dataKey={dataKey}
          nameKey={nameKey}
          paddingAngle={2}
          labelLine={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "2 2" }}
          label={(props: any) => (
            <DonutPieLabel
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
          formatter={(value) => [
            `${Number(value).toLocaleString()} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
            "Views",
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingTop: 10, fontSize: 11, color: TICK_COLOR }}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: TICK_COLOR }}>
              {truncateLabel(value, 18)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Referrers — horizontal bar
// 36px per row (matches index.tsx horizontal bar convention)
// ---------------------------------------------------------------------------

export function ReferrersChart({ data }: ChartProps) {
  const chartHeight = Math.max(260, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={MARGIN_HORIZONTAL_BAR}
      >
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
          width={140}
          tick={{ fill: TICK_COLOR }}
          tickFormatter={(v) => truncateLabel(v, 22)}
        />
        <Tooltip
          labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="count" name="Visits" fill="#10B981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Countries — horizontal grouped bar (views + unique visitors)
//
// barSize keeps bars from crushing each other when there are few rows.
// The legend sits at top so it doesn't fight with the YAxis labels.
// ---------------------------------------------------------------------------

export function CountriesChart({ data }: ChartProps) {
  // 44px per row gives enough breathing room for two grouped bars
  const chartHeight = Math.max(260, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 36, right: 32, left: 0, bottom: 4 }}
        barSize={10}
        barCategoryGap="30%"
      >
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
          width={100}
          tick={{ fill: TICK_COLOR }}
          tickFormatter={(v) => truncateLabel(v, 16)}
        />
        <Tooltip
          labelStyle={{ fontWeight: 600, color: "#1E1B2E" }}
          contentStyle={{ fontSize: 12 }}
        />
        {/* Legend at top with extra top margin in the chart container above */}
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ top: 0, fontSize: 11, color: TICK_COLOR }}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: TICK_COLOR }}>{value}</span>
          )}
        />
        <Bar dataKey="count" name="Page Views" fill="#F59E0B" radius={[0, 4, 4, 0]} />
        <Bar dataKey="uniqueVisitors" name="Unique Visitors" fill="#581C87" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
