"use client"

import { useEffect, useState } from "react"
import { getBudgetSummary, type SavingsPeriod } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"

type Tab = "week" | "month"

function PeriodDisplay({ period, label }: { period: SavingsPeriod; label: string }) {
  const saved = period.saved_gbp ?? 0
  const isPositive = saved > 0
  const animatedSaved = useCountUp(Math.abs(saved), 1200, 300)

  if (period.actual_gbp === null) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted">
          No actual spend recorded {label === "week" ? "this week" : "this month"} yet
        </p>
        <p className="text-xs text-muted mt-1">
          Record what you spent after shopping to see your savings
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-2">
      <p className={`font-display text-4xl sm:text-5xl font-bold tracking-tight ${
        isPositive
          ? "text-green-600 dark:text-green-400"
          : saved < 0
            ? "text-red-500 dark:text-red-400"
            : "text-ink"
      }`}>
        {isPositive ? "" : saved < 0 ? "+" : ""}
        {gbp(animatedSaved)}
      </p>
      <p className="text-sm text-muted mt-2">
        {isPositive
          ? `saved ${label === "week" ? "this week" : "this month"}`
          : saved < 0
            ? `over budget ${label === "week" ? "this week" : "this month"}`
            : `on budget ${label === "week" ? "this week" : "this month"}`}
      </p>
      <p className="text-xs text-muted mt-1">
        across {period.plan_count} plan{period.plan_count !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

export function SavingsHeadline() {
  const [tab, setTab] = useState<Tab>("week")
  const [week, setWeek] = useState<SavingsPeriod | null>(null)
  const [month, setMonth] = useState<SavingsPeriod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getBudgetSummary()
      .then((data) => {
        if (cancelled) return
        setWeek(data.this_week)
        setMonth(data.this_month)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return null

  if (week && month && week.plan_count === 0 && month.plan_count === 0) return null

  const period = tab === "week" ? week : month

  return (
    <div className="rounded-lg border-2 border-line bg-bg p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-muted">Your savings</p>
        <div className="flex gap-1 bg-chip rounded-md p-0.5">
          <button
            onClick={() => setTab("week")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tab === "week"
                ? "bg-bg text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTab("month")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tab === "month"
                ? "bg-bg text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {period && <PeriodDisplay period={period} label={tab} />}
    </div>
  )
}
