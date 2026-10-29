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
import { COAL_COLOR } from './OverviewChart'

const axisStyle = { fontSize: 11, fill: '#64748b' }

function CoalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: MergedRow = payload[0].payload
  if (row.coalMid == null) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-300">{label}</div>
      <div className="space-y-1 text-slate-400">
        <div className="flex gap-3">
          <span>报价区间</span>
          <span className="ml-auto font-semibold text-slate-100">
            {row.coalLow}–{row.coalHigh} 元/吨
          </span>
        </div>
        <div className="flex gap-3">
          <span>区间中值</span>
          <span className="ml-auto text-amber-300">{row.coalMid} 元/吨</span>
        </div>
        <div className="pt-1 text-[10px] text-slate-500">
          报价日 {row.coalQuoteDate} · {row.coalSource}
        </div>
      </div>
    </div>
  )
}

/** 只在真实报价日画圆点，其余日期为阶梯延续 */
function QuoteDot(props: any) {
  const { cx, cy, payload } = props
  if (!payload?.isQuote) return <g />
  return <circle cx={cx} cy={cy} r={3.5} fill="#0f172a" stroke={COAL_COLOR} strokeWidth={2} />
}

export default function CoalChart({ rows }: { rows: MergedRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
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
            domain={[(dataMin: number) => Math.floor(dataMin - 40), (dataMax: number) => Math.ceil(dataMax + 40)]}
            tick={axisStyle}
            stroke="#334155"
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CoalTooltip />} />
          <Area
            type="stepAfter"
            dataKey="coalRange"
            stroke={COAL_COLOR}
            strokeOpacity={0.35}
            strokeWidth={1}
            fill={COAL_COLOR}
            fillOpacity={0.14}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey="coalMid"
            stroke={COAL_COLOR}
            strokeWidth={2}
            dot={<QuoteDot />}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
