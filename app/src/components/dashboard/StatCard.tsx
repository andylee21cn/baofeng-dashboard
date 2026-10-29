import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  change?: number | null
  changeLabel?: string
  icon?: ReactNode
  accent?: 'sky' | 'amber' | 'teal'
}

const accentClass = {
  sky: 'text-sky-400',
  amber: 'text-amber-400',
  teal: 'text-teal-400',
} as const

export default function StatCard({ title, value, sub, change, changeLabel, icon, accent = 'sky' }: StatCardProps) {
  const hasChange = change !== null && change !== undefined
  const up = (change ?? 0) >= 0
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{title}</span>
        <span className={accentClass[accent]}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {hasChange && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${
              up ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {up ? '+' : ''}
            {change}%{changeLabel ? ` ${changeLabel}` : ''}
          </span>
        )}
        {sub && <span className="text-slate-500">{sub}</span>}
      </div>
    </div>
  )
}
