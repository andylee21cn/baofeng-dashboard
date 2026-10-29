import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { fmtDate, type MergedRow } from '@/lib/series'
import { marketEvents } from '@/data/events'
import { STOCK_COLOR, COAL_COLOR } from './OverviewChart'
import { OIL_COLOR } from './OilChart'

const axisStyle = { fontSize: 11, fill: '#64748b' }

const THEME_COLOR: Record<string, string> = {
  oil: OIL_COLOR,
  coal: COAL_COLOR,
  both: '#94a3b8',
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: MergedRow = payload[0].payload
  const items = [
    {
      name: '宝丰能源',
      color: STOCK_COLOR,
      idx: row.stockIdx,
      raw: `¥${row.close.toFixed(2)}`,
    },
    {
      name: 'Q5500 坑口价',
      color: COAL_COLOR,
      idx: row.coalIdx,
      raw: row.coalMid != null ? `${row.coalLow}–${row.coalHigh} 元/吨` : '—',
    },
    {
      name: '布伦特原油',
      color: OIL_COLOR,
      idx: row.oilIdx,
      raw: row.oilClose != null ? `$${row.oilClose.toFixed(2)}` : '—',
    },
  ]
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-300">{label}</div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.name}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
              <span className="text-slate-400">{it.name}</span>
              <span className="ml-auto font-semibold text-slate-100">{it.idx ?? '—'}</span>
            </div>
            <div className="pl-4 text-[10px] text-slate-500">{it.raw}</div>
          </div>
        ))}
      </div>
      {row.coalQuoteDate && (
        <div className="mt-1 border-t border-slate-800 pt-1 text-[10px] text-slate-500">
          煤价报价日 {row.coalQuoteDate} · {row.coalSource}
        </div>
      )}
    </div>
  )
}

/** 三大指标归一化趋势对比（区间起点 = 100），带关键事件标注 */
export default function TrendChart({ rows }: { rows: MergedRow[] }) {
  const first = rows[0]?.date ?? ''
  const last = rows[rows.length - 1]?.date ?? ''
  const rowDates = new Set(rows.map((r) => r.date))
  const visibleEvents = marketEvents
    .map((e, i) => ({ ...e, num: i + 1 }))
    .filter((e) => e.date >= first && e.date <= last && rowDates.has(e.date))

  return (
    <div>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
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
            />
            <Tooltip content={<TrendTooltip />} />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 4" />
            {visibleEvents.map((e) => (
              <ReferenceLine
                key={e.date}
                x={e.date}
                stroke={THEME_COLOR[e.theme]}
                strokeOpacity={0.55}
                strokeDasharray="3 3"
                label={{
                  value: e.num,
                  position: 'top',
                  fill: THEME_COLOR[e.theme],
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
            ))}
            <Line
              type="monotone"
              dataKey="stockIdx"
              stroke={STOCK_COLOR}
              strokeWidth={2.2}
              dot={false}
              name="宝丰能源"
            />
            <Line
              type="stepAfter"
              dataKey="coalIdx"
              stroke={COAL_COLOR}
              strokeWidth={1.8}
              dot={false}
              connectNulls
              name="Q5500 坑口价"
            />
            <Line
              type="stepAfter"
              dataKey="oilIdx"
              stroke={OIL_COLOR}
              strokeWidth={1.8}
              dot={false}
              connectNulls
              name="布伦特原油"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {visibleEvents.length > 0 && (
        <div className="mt-3 grid gap-2 border-t border-slate-800 pt-3 sm:grid-cols-2">
          {visibleEvents.map((e) => (
            <div key={e.date} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <span
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-slate-950"
                style={{ background: THEME_COLOR[e.theme] }}
              >
                {e.num}
              </span>
              <div>
                <span className="font-medium text-slate-300">
                  {e.date.slice(5).replace('-', '/')} {e.label}
                </span>
                <span className="ml-1 text-slate-500">{e.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
