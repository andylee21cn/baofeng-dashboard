import { stockBars, coalPoints, oilBars, type StockBar, type OilBar, type CoalPoint } from '@/data/marketData'

export type RangeKey = '3M' | '6M' | '1Y'

export interface MergedRow {
  date: string
  close: number
  open: number
  high: number
  low: number
  volume: number
  coalMid: number | null
  coalLow: number | null
  coalHigh: number | null
  coalRange: [number, number] | null
  coalQuoteDate: string | null
  coalSource: string | null
  isQuote: boolean
  oilClose: number | null
  oilDate: string | null
  stockIdx: number | null
  coalIdx: number | null
  oilIdx: number | null
}

export function rangeStartDate(key: RangeKey): string {
  const end = stockBars[stockBars.length - 1].date
  const months = key === '3M' ? 3 : key === '6M' ? 6 : 12
  const d = new Date(end + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

export function filterBars(bars: StockBar[], key: RangeKey): StockBar[] {
  const start = rangeStartDate(key)
  return bars.filter((b) => b.date >= start)
}

/** 合并股价（交易日频）与煤价（不定期报价）、油价（外盘交易日），
 *  煤价按“最近一次报价”阶梯延续，油价按“最近一个交易日收盘”延续 */
export function buildMerged(bars: StockBar[], key: RangeKey): MergedRow[] {
  const filtered = filterBars(bars, key)
  const start = filtered.length ? filtered[0].date : ''
  const sortedCoal = [...coalPoints].sort((a, b) => a.date.localeCompare(b.date))
  const sortedOil = [...oilBars].sort((a, b) => a.date.localeCompare(b.date))
  const rows: MergedRow[] = []
  let ci = -1
  let oi = -1
  for (const b of filtered) {
    while (ci + 1 < sortedCoal.length && sortedCoal[ci + 1].date <= b.date) ci++
    while (oi + 1 < sortedOil.length && sortedOil[oi + 1].date <= b.date) oi++
    const c: CoalPoint | null = ci >= 0 ? sortedCoal[ci] : null
    const o: OilBar | null = oi >= 0 ? sortedOil[oi] : null
    rows.push({
      date: b.date,
      close: b.close,
      open: b.open,
      high: b.high,
      low: b.low,
      volume: b.volume,
      coalMid: c ? c.mid : null,
      coalLow: c ? c.low : null,
      coalHigh: c ? c.high : null,
      coalRange: c ? [c.low, c.high] : null,
      coalQuoteDate: c ? c.date : null,
      coalSource: c ? c.source : null,
      isQuote: !!c && c.date === b.date,
      oilClose: o ? o.close : null,
      oilDate: o ? o.date : null,
      stockIdx: null,
      coalIdx: null,
      oilIdx: null,
    })
  }
  const stockBase = filtered.length ? filtered[0].close : 1
  const coalBase = rows.find((r) => r.coalMid != null)?.coalMid ?? 1
  const oilBaseRow = rows.find((r) => r.oilClose != null && (r.oilDate ?? '') >= start)
  const oilBase = oilBaseRow?.oilClose ?? rows.find((r) => r.oilClose != null)?.oilClose ?? 1
  for (const r of rows) {
    r.stockIdx = +((r.close / stockBase) * 100).toFixed(2)
    r.coalIdx = r.coalMid != null ? +((r.coalMid / coalBase) * 100).toFixed(2) : null
    r.oilIdx = r.oilClose != null ? +((r.oilClose / oilBase) * 100).toFixed(2) : null
  }
  return rows
}

export interface DashboardStats {
  lastClose: number
  prevClose: number
  dayChange: number
  dayChangePct: number
  yearHigh: number
  yearLow: number
  periodChangePct: number
  avgVolumeWan: number
  coalLast: CoalPoint
  coalFirstInYear: CoalPoint
  coalYearChangePct: number
  coalPeriodHigh: number
  coalPeriodLow: number
  oilLast: OilBar | null
  oilPrev: OilBar | null
  oilDayChangePct: number | null
  oilPeriodChangePct: number | null
  oilPeriodHigh: number | null
  oilPeriodLow: number | null
}

export function computeStats(key: RangeKey): DashboardStats {
  const bars = filterBars(stockBars, key)
  const last = stockBars[stockBars.length - 1]
  const prev = stockBars[stockBars.length - 2]
  const first = bars[0]
  const high = Math.max(...bars.map((b) => b.high))
  const low = Math.min(...bars.map((b) => b.low))
  const avgVol = bars.reduce((s, b) => s + b.volume, 0) / bars.length
  const start = rangeStartDate(key)
  const coalInRange = coalPoints.filter((c) => c.date >= start)
  const coalLast = coalPoints[coalPoints.length - 1]
  const coalFirst = coalInRange[0] ?? coalPoints[0]
  // 油价统计（基于区间内的交易日）
  const oilInRange = oilBars.filter((o) => o.date >= start)
  const oilLast = oilBars.length ? oilBars[oilBars.length - 1] : null
  const oilPrev = oilBars.length > 1 ? oilBars[oilBars.length - 2] : null
  const oilFirst = oilInRange[0] ?? null
  return {
    lastClose: last.close,
    prevClose: prev.close,
    dayChange: +(last.close - prev.close).toFixed(2),
    dayChangePct: +(((last.close - prev.close) / prev.close) * 100).toFixed(2),
    yearHigh: high,
    yearLow: low,
    periodChangePct: +(((last.close - first.close) / first.close) * 100).toFixed(1),
    avgVolumeWan: Math.round(avgVol / 10000),
    coalLast,
    coalFirstInYear: coalFirst,
    coalYearChangePct: +(((coalLast.mid - coalFirst.mid) / coalFirst.mid) * 100).toFixed(1),
    coalPeriodHigh: Math.max(...coalInRange.map((c) => c.high)),
    coalPeriodLow: Math.min(...coalInRange.map((c) => c.low)),
    oilLast,
    oilPrev,
    oilDayChangePct:
      oilLast && oilPrev ? +(((oilLast.close - oilPrev.close) / oilPrev.close) * 100).toFixed(2) : null,
    oilPeriodChangePct:
      oilLast && oilFirst ? +(((oilLast.close - oilFirst.close) / oilFirst.close) * 100).toFixed(1) : null,
    oilPeriodHigh: oilInRange.length ? Math.max(...oilInRange.map((o) => o.high)) : null,
    oilPeriodLow: oilInRange.length ? Math.min(...oilInRange.map((o) => o.low)) : null,
  }
}

export const fmtDate = (d: string) => d.slice(5).replace('-', '/')
