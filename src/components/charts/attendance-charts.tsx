import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AttendanceStatus } from '@/types'
import { ATTENDANCE_STATUS_META, CHART_COLORS } from '@/lib/constants'

const axisStyle = {
  fontSize: 10,
  fill: 'var(--muted-foreground)',
  fontFamily: 'inherit',
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  fontSize: 11,
  boxShadow: '0 12px 30px -18px rgba(15,30,51,.4)',
}

type TrendPoint = {
  label: string
  hadir: number
  terlambat: number
  izin: number
  alpa: number
  rate: number
}

export function AttendanceBarChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            formatter={(value: unknown, name: unknown) => [
              String(value ?? ''),
              name ? String(name).charAt(0).toUpperCase() + String(name).slice(1) : '',
            ]}
          />
          <Bar dataKey="hadir" stackId="a" fill={CHART_COLORS.emerald} radius={[0, 0, 0, 0]} />
          <Bar dataKey="terlambat" stackId="a" fill={CHART_COLORS.accent} />
          <Bar dataKey="izin" stackId="a" fill={CHART_COLORS.sky} />
          <Bar dataKey="alpa" stackId="a" fill={CHART_COLORS.rose} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AttendanceRateChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown) => [`${value ?? 0}%`, 'Kehadiran']}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            fill="url(#rateFill)"
            dot={{ r: 3, strokeWidth: 2, fill: 'var(--card)' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const statusColors: Record<AttendanceStatus, string> = {
  present: CHART_COLORS.emerald,
  late: CHART_COLORS.accent,
  absent: CHART_COLORS.rose,
  leave: CHART_COLORS.sky,
  sick: CHART_COLORS.violet,
}

export function StatusDonut({
  counts,
  centerLabel = 'Hari',
}: {
  counts: Record<AttendanceStatus, number>
  centerLabel?: string
}) {
  const entries = (Object.keys(counts) as AttendanceStatus[])
    .map((status) => ({
      status,
      name: ATTENDANCE_STATUS_META[status].label,
      value: counts[status],
    }))
    .filter((item) => item.value > 0)
  const total = entries.reduce((sum, item) => sum + item.value, 0)

  if (!total) {
    return (
      <div className="flex h-[210px] items-center justify-center text-xs text-muted-foreground">
        Belum ada data kehadiran.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="relative mx-auto h-[190px] w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              strokeWidth={0}
            >
              {entries.map((entry) => (
                <Cell key={entry.status} fill={statusColors[entry.status]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold">{total}</span>
          <span className="text-[10px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
        {entries.map((entry) => (
          <div key={entry.status} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColors[entry.status] }}
              />
              {entry.name}
            </span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DivisionBarChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ ...axisStyle, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={118}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
