"use client"

import { useEffect, useState } from "react"
import { getBudgetSummary, type BudgetSummary, type SavingsPeriod } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"

type Tab = "week" | "month"

function baselineLabel(source: "personal" | "ons", householdSize: number): string {
  if (source === "personal") return "your usual shop"
  const who = householdSize === 1 ? "1 person" : `${householdSize} people`
  return `the UK average for ${who}`
}

function PeriodDisplay({
  period,
  label,
  source,
  householdSize,
}: {
  period: SavingsPeriod
  label: Tab
  source: "personal" | "ons"
  householdSize: number
}) {
  const saved = period.baseline_saved_gbp ?? 0
  const isPositive = saved > 0
  const animatedSaved = useCountUp(Math.abs(saved), 1200, 300)
  const periodWord = label === "week" ? "this week" : "this month"

  if (period.plan_count === 0 || period.baseline_saved_gbp === null) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted">
          No plans {periodWord} yet
        </p>
        <p className="text-xs text-muted mt-1">
          Generate a plan to see how it compares
        </p>
      </div>
    )
  }

  const comparisonBasis = period.actual_gbp !== null
    ? "based on what you spent"
    : "projected from your plan"

  return (
    <div className="text-center py-2">
      <p className={`font-display text-4xl sm:text-5xl font-bold tracking-tight ${
        isPositive
          ? "text-green-600 dark:text-green-400"
          : saved < 0
            ? "text-red-500 dark:text-red-400"
            : "text-ink"
      }`}>
        {gbp(animatedSaved)}
      </p>
      <p className="text-sm text-muted mt-2">
        {isPositive
          ? `saved ${periodWord} vs ${baselineLabel(source, householdSize)}`
          : saved < 0
            ? `over ${baselineLabel(source, householdSize)} ${periodWord}`
            : `in line with ${baselineLabel(source, householdSize)}`}
      </p>
      <p className="text-xs text-muted mt-1">
        {comparisonBasis}
      </p>
    </div>
  )
}

export function SavingsHeadline() {
  const [tab, setTab] = useState<Tab>("week")
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getBudgetSummary()
      .then((data) => {
        if (cancelled) return
        setSummary(data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || !summary) return null

  if (summary.this_week.plan_count === 0 && summary.this_month.plan_count === 0) return null

  const period = tab === "week" ? summary.this_week : summary.this_month

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

      <PeriodDisplay
        period={period}
        label={tab}
        source={summary.baseline_source}
        householdSize={summary.household_size}
      />
    </div>
  )
}
