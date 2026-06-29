"use client"

import { useState } from "react"
import type { PlannedMeal } from "@/lib/api"
import { updateActualCost } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { CostBreakdownBar } from "./CostBreakdownBar"

type Props = {
  planId: string | null
  meals: PlannedMeal[]
  totalCost: number
  budget: number
  budgetUtilization: number
  actualCost: number | null
  onActualCostSaved: (cost: number) => void
}

export function BudgetDashboard({
  planId,
  meals,
  totalCost,
  budget,
  budgetUtilization,
  actualCost,
  onActualCostSaved,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pct = Math.round(budgetUtilization * 100)
  const saved = actualCost !== null ? totalCost - actualCost : null

  const handleSave = async () => {
    const parsed = parseFloat(inputValue)
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount")
      return
    }
    if (!planId) {
      setError("Plan not saved yet")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateActualCost(planId, parsed)
      onActualCostSaved(parsed)
      setEditing(false)
      setInputValue("")
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const eyebrow = "text-xs uppercase tracking-widest text-muted"

  return (
    <div className="space-y-6">
      {/* Projected vs Budget bar */}
      <div>
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted mb-2">
          <span>Projected spend</span>
          <span className="font-mono">
            {gbp(totalCost)} / {gbp(budget)}
          </span>
        </div>
        <div className="h-2 bg-chip rounded-sm overflow-hidden">
          <div
            className="h-full bg-accent transition-all ease-out duration-1000"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2 font-mono">
          <span>£0</span>
          <span>{pct}% of budget</span>
          <span>{gbp(budget)}</span>
        </div>
      </div>

      <CostBreakdownBar meals={meals} budget={budget} />

      <hr className="border-line" />

      {/* Actual cost section */}
      <div>
        <p className={`${eyebrow} mb-3`}>Actual spend</p>

        {actualCost !== null && !editing ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg text-ink">{gbp(actualCost)}</span>
              <button
                onClick={() => {
                  setInputValue(actualCost.toFixed(2))
                  setEditing(true)
                }}
                className="text-xs text-muted hover:text-ink underline"
              >
                Edit
              </button>
            </div>

            {/* Projected vs Actual comparison */}
            <div className="p-4 rounded-lg bg-chip">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Projected</span>
                <span className="font-mono text-ink">{gbp(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted">Actual</span>
                <span className="font-mono text-ink">{gbp(actualCost)}</span>
              </div>
              <hr className="border-line mb-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted">Difference</span>
                <span className={`font-mono font-medium ${saved !== null && saved >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {saved !== null ? (saved >= 0 ? `−${gbp(saved)}` : `+${gbp(Math.abs(saved))}`) : "—"}
                </span>
              </div>
              {saved !== null && saved > 0 && (
                <p className="text-xs text-muted mt-2">
                  You spent {gbp(saved)} less than projected
                </p>
              )}
              {saved !== null && saved < 0 && (
                <p className="text-xs text-muted mt-2">
                  You spent {gbp(Math.abs(saved))} more than projected
                </p>
              )}
            </div>

            {/* Visual comparison bar */}
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Projected vs Actual</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-16">Projected</span>
                  <div className="flex-1 h-2 bg-chip rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-sm"
                      style={{ width: `${(totalCost / budget) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-16">Actual</span>
                  <div className="flex-1 h-2 bg-chip rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${Math.min(100, (actualCost / budget) * 100)}%`,
                        backgroundColor: actualCost <= totalCost ? "var(--accent)" : "var(--accent)",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!editing ? (
              <div className="p-4 rounded-lg border border-dashed border-line text-center">
                <p className="text-sm text-muted mb-3">
                  Record what you actually spent to track your savings
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-accent text-accent-fg rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Record actual spend
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
                      placeholder="0.00"
                      autoFocus
                      className="w-full pl-7 pr-3 py-2 border border-line rounded-md bg-bg text-ink font-mono text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-accent text-accent-fg rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setInputValue(""); setError(null) }}
                    className="px-3 py-2 text-sm text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
