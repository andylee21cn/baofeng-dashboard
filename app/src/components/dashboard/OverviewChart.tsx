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

export const STOCK_COLOR = '#38bdf8'
export const COAL_COLOR = '#f59e0b'

const axisStyle = { fontSize: 11, fill: '#64748b' }

function OverviewTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: MergedRow = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-300">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: STOCK_COLOR }} />
          <span className="text-slate-400">宝丰能源收盘</span>
          <span className="ml-auto font-semibold text-slate-100">¥{row.close.toFixed(2)}</span>
        </div>
        {row.coalMid != null && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: COAL_COLOR }} />
            <span className="text-slate-400">Q5500 坑口价</span>
            <span className="ml-auto font-semibold text-slate-100">
              {row.coalLow}–{row.coalHigh} 元/吨
            </span>
          </div>
        )}
        {row.coalQuoteDate && (
          <div className="pt-1 text-[10px] text-slate-500">
            煤价报价日 {row.coalQuoteDate} · {row.coalSource}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OverviewChart({ rows }: { rows: MergedRow[] }) {
  return (
    <div className="h-[380px] w-full">
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
            yAxisId="stock"
            orientation="left"
            domain={['auto', 'auto']}
            tick={axisStyle}
            stroke="#334155"
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `¥${v}`}
          />
          <YAxis
            yAxisId="coal"
            orientation="right"
            domain={[(dataMin: number) => Math.floor(dataMin - 40), (dataMax: number) => Math.ceil(dataMax + 40)]}
            tick={axisStyle}
            stroke="#334155"
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<OverviewTooltip />} />
          <Area
            yAxisId="coal"
            type="stepAfter"
            dataKey="coalRange"
            stroke="none"
            fill={COAL_COLOR}
            fillOpacity={0.14}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            yAxisId="coal"
            type="stepAfter"
            dataKey="coalMid"
            stroke={COAL_COLOR}
            strokeWidth={1.6}
            dot={false}
            connectNulls
            name="煤价中值"
          />
          <Line
            yAxisId="stock"
            type="monotone"
            dataKey="close"
            stroke={STOCK_COLOR}
            strokeWidth={2}
            dot={false}
            name="收盘价"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
