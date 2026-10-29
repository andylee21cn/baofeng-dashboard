import { useMemo, useState } from 'react'
import { Activity, Database, Droplets, Flame, LineChart, TrendingUp } from 'lucide-react'
import { STOCK_NAME, STOCK_CODE, COAL_NAME, OIL_NAME, stockBars } from '@/data/marketData'
import { buildMerged, computeStats, type RangeKey } from '@/lib/series'
import StatCard from '@/components/dashboard/StatCard'
import OverviewChart, { STOCK_COLOR, COAL_COLOR } from '@/components/dashboard/OverviewChart'
import StockChart from '@/components/dashboard/StockChart'
import CoalChart from '@/components/dashboard/CoalChart'
import OilChart, { OIL_COLOR } from '@/components/dashboard/OilChart'
import TrendChart from '@/components/dashboard/TrendChart'
import '../App.css'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '3M', label: '近 3 月' },
  { key: '6M', label: '近半年' },
  { key: '1Y', label: '近一年' },
]

export default function Home() {
  const [range, setRange] = useState<RangeKey>('1Y')
  const [chartMode, setChartMode] = useState<'trend' | 'dual'>('trend')
  const rows = useMemo(() => buildMerged(stockBars, range), [range])
  const stats = useMemo(() => computeStats(range), [range])
  const lastDate = stockBars[stockBars.length - 1].date

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* 头部 */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {STOCK_NAME} <span className="text-slate-500">×</span> 动力煤坑口价 <span className="text-slate-500">×</span> 国际油价
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {STOCK_CODE} 日线行情 与 {COAL_NAME}、{OIL_NAME} 趋势对比
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5">
                <Database className="h-3 w-3" /> 行情：腾讯行情（前复权）
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5">
                <Database className="h-3 w-3" /> 煤价：Mysteel 日评 / CCTD
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5">
                <Database className="h-3 w-3" /> 油价：新浪财经（Brent）
              </span>
              <span>数据截至 {lastDate}</span>
            </div>
          </div>
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === opt.key
                    ? 'bg-slate-700 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {/* 指标卡 */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            title="宝丰能源收盘价"
            value={`¥${stats.lastClose.toFixed(2)}`}
            change={stats.dayChangePct}
            changeLabel="日涨跌"
            icon={<LineChart className="h-4 w-4" />}
          />
          <StatCard
            title="股价区间涨跌幅"
            value={`${stats.periodChangePct > 0 ? '+' : ''}${stats.periodChangePct}%`}
            sub={`区间 ${stats.yearLow.toFixed(2)}–${stats.yearHigh.toFixed(2)} 元`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="日均成交量"
            value={`${stats.avgVolumeWan} 万股`}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Q5500 坑口价中值"
            value={`${stats.coalLast.mid} 元/吨`}
            sub={`区间 ${stats.coalLast.low}–${stats.coalLast.high}`}
            icon={<Flame className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="煤价区间涨跌幅"
            value={`${stats.coalYearChangePct > 0 ? '+' : ''}${stats.coalYearChangePct}%`}
            sub={`区间 ${stats.coalPeriodLow}–${stats.coalPeriodHigh} 元`}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="布伦特原油收盘"
            value={stats.oilLast ? `$${stats.oilLast.close.toFixed(2)}` : '—'}
            change={stats.oilDayChangePct}
            changeLabel="日涨跌"
            icon={<Droplets className="h-4 w-4" />}
            accent="teal"
          />
          <StatCard
            title="油价区间涨跌幅"
            value={
              stats.oilPeriodChangePct != null
                ? `${stats.oilPeriodChangePct > 0 ? '+' : ''}${stats.oilPeriodChangePct}%`
                : '—'
            }
            sub={
              stats.oilPeriodLow != null && stats.oilPeriodHigh != null
                ? `区间 ${stats.oilPeriodLow.toFixed(1)}–${stats.oilPeriodHigh.toFixed(1)} 美元`
                : undefined
            }
            icon={<TrendingUp className="h-4 w-4" />}
            accent="teal"
          />
        </section>

        {/* 主对比图：三指标趋势 / 双轴 */}
        <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              {chartMode === 'trend' ? '三大指标趋势对比（区间起点 = 100）' : '股价 × 煤价 双轴对比'}
            </h2>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-4 text-[11px] text-slate-400 md:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded" style={{ background: STOCK_COLOR }} />
                  宝丰能源
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded" style={{ background: COAL_COLOR }} />
                  Q5500 坑口价
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded" style={{ background: OIL_COLOR }} />
                  布伦特原油
                </span>
              </div>
              <div className="flex rounded-lg border border-slate-700 bg-slate-950/60 p-0.5">
                <button
                  onClick={() => setChartMode('trend')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    chartMode === 'trend' ? 'bg-slate-700 text-slate-50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  三线归一化
                </button>
                <button
                  onClick={() => setChartMode('dual')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    chartMode === 'dual' ? 'bg-slate-700 text-slate-50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  股价×煤价双轴
                </button>
              </div>
            </div>
          </div>
          {chartMode === 'trend' ? <TrendChart rows={rows} /> : <OverviewChart rows={rows} />}
          {chartMode === 'trend' && (
            <p className="mt-2 text-[11px] text-slate-500">
              三者单位不同（元/股、元/吨、美元/桶），归一化后比较相对涨跌幅；悬停可查看当日实际值。
            </p>
          )}
        </section>

        {/* 三个明细图 */}
        <section className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">宝丰能源 · 收盘价与成交量</h2>
              <span className="text-[11px] text-slate-500">前复权 · 日线</span>
            </div>
            <StockChart rows={rows} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">鄂尔多斯 Q5500 坑口价（含税）</h2>
              <span className="text-[11px] text-slate-500">圆点为实际报价日 · 阶梯延续</span>
            </div>
            <CoalChart rows={rows} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">布伦特原油（Brent）</h2>
              <span className="text-[11px] text-slate-500">美元/桶 · 外盘日线</span>
            </div>
            <OilChart rows={rows} />
          </div>
        </section>

        {/* 数据说明 */}
        <footer className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-[11px] leading-relaxed text-slate-500">
          <p>
            数据说明：股价为宝丰能源（600989.SH）前复权日线行情（初始数据来自 iFinD，每日自动更新切换为腾讯行情接口）；煤价为公开渠道发布的内蒙古鄂尔多斯
            Q5500 动力煤坑口含税报价（以 Mysteel 市场日评为主，辅以 CCTD 鄂尔多斯混煤指数及券商周报），属不定期报价序列，图中按“最近一次报价”阶梯延续，阴影带为报价区间、圆点为实际报价日，不代表每日连续成交价；油价为新浪财经布伦特原油连续合约日线（美元/桶），非 A 股交易日按最近一个外盘交易日收盘价延续。数据每日 18:47（Asia/Shanghai）自动更新。
          </p>
          <p className="mt-1">本页面仅为信息展示，不构成任何投资建议。市场有风险，投资需谨慎。</p>
        </footer>
      </div>
    </div>
  )
}
