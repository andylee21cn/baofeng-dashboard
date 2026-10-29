import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { fmtDate, type MergedRow } from '@/lib/series'
import { STOCK_COLOR } from './OverviewChart'

const axisStyle = { fontSize: 11, fill: '#64748b' }

function StockTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: MergedRow = payload[0].payload
  const up = row.close >= row.open
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-300">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
        <span>开盘</span>
        <span className="text-right text-slate-100">¥{row.open.toFixed(2)}</span>
        <span>最高</span>
        <span className="text-right text-slate-100">¥{row.high.toFixed(2)}</span>
        <span>最低</span>
        <span className="text-right text-slate-100">¥{row.low.toFixed(2)}</span>
        <span>收盘</span>
        <span className={`text-right font-semibold ${up ? 'text-red-400' : 'text-emerald-400'}`}>
          ¥{row.close.toFixed(2)}
        </span>
        <span>成交量</span>
        <span className="text-right text-slate-100">{(row.volume / 10000).toFixed(0)} 万股</span>
      </div>
    </div>
  )
}

export default function StockChart({ rows }: { rows: MergedRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={STOCK_COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={STOCK_COLOR} stopOpacity={0.02} />
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
            yAxisId="price"
            domain={['auto', 'auto']}
            tick={axisStyle}
            stroke="#334155"
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `¥${v}`}
          />
          <YAxis yAxisId="vol" orientation="right" hide domain={[0, (dataMax: number) => dataMax * 4]} />
          <Tooltip content={<StockTooltip />} />
          <Bar yAxisId="vol" dataKey="volume" fill="#475569" fillOpacity={0.45} isAnimationActive={false} />
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke={STOCK_COLOR}
            strokeWidth={2}
            fill="url(#stockFill)"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
