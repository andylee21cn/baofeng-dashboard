import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { fmtDate, type MergedRow } from '@/lib/series'

export const OIL_COLOR = '#2dd4bf'

const axisStyle = { fontSize: 11, fill: '#64748b' }

function OilTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: MergedRow = payload[0].payload
  if (row.oilClose == null) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-300">{label}</div>
      <div className="flex gap-3 text-slate-400">
        <span>布伦特收盘</span>
        <span className="ml-auto font-semibold text-slate-100">${row.oilClose.toFixed(2)}</span>
      </div>
      {row.oilDate && row.oilDate !== row.date && (
        <div className="pt-1 text-[10px] text-slate-500">延续 {row.oilDate} 外盘收盘价</div>
      )}
    </div>
  )
}

export default function OilChart({ rows }: { rows: MergedRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="oilFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={OIL_COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={OIL_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={axisStyle}
            stroke="#334155"
            minTickGap={48}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={axisStyle}
            stroke="#334155"
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip content={<OilTooltip />} />
          <Area
            type="stepAfter"
            dataKey="oilClose"
            stroke={OIL_COLOR}
            strokeWidth={2}
            fill="url(#oilFill)"
            dot={false}
            connectNulls
          />
          <Line type="stepAfter" dataKey="oilClose" stroke="none" dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
