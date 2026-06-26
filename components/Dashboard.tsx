"use client"

import { useState } from "react"
import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"
import { CalorieDistribution } from "./CalorieDistribution"
import { ShoppingListView } from "./ShoppingList"
import { BudgetDashboard } from "./BudgetDashboard"
import { SavingsHeadline } from "./SavingsHeadline"

type Tab = "plan" | "shopping" | "savings" | "pantry"

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
}

export function Dashboard({ plan, calorieTarget, householdSize, onSelectMeal, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("plan")
  const [actualCost, setActualCost] = useState<number | null>(null)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  const activeMeals = plan.meals.filter((_, i) => !skipped.has(i))
  const activeCost = activeMeals.reduce((s, m) => s + m.total_cost_gbp, 0)
  const animatedCost = useCountUp(activeCost, 1000, 200)

  const cuisineCounts = activeMeals.reduce<Record<string, number>>((acc, m) => {
    acc[m.cuisine] = (acc[m.cuisine] ?? 0) + 1
    return acc
  }, {})
  const cuisineBreakdown = Object.entries(cuisineCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([c, n]) => `${c} × ${n}`)
    .join(", ")

  const toggleSkip = (index: number) => {
    setSkipped(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "plan", label: "Plan" },
    { id: "shopping", label: "Shopping List" },
    { id: "savings", label: "Savings" },
    { id: "pantry", label: "Pantry" },
  ]

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-800">
      <div className="mb-6">
        <h2 className="font-display text-2xl sm:text-3xl text-ink">
          Your week — {activeMeals.length} meal{activeMeals.length !== 1 ? "s" : ""},{" "}
          <span className="font-mono">{gbp(animatedCost)}</span> total
        </h2>
        {skipped.size > 0 && (
          <p className="text-sm text-muted mt-1">
            {skipped.size} night{skipped.size !== 1 ? "s" : ""} skipped
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-line mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={onReset}
          className="px-4 py-2 bg-accent text-accent-fg rounded-md text-sm font-medium hover:opacity-90 transition-opacity ml-2 mb-2 whitespace-nowrap"
        >
          + New plan
        </button>
      </div>

      {activeTab === "plan" && (
        <div className="animate-in fade-in duration-300">
          {plan.warnings.length > 0 && (
            <div className="mb-8 p-4 border border-line rounded-md bg-chip">
              {plan.warnings.map((w, i) => (
                <p key={i} className="text-sm text-ink">{w}</p>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {plan.meals.map((meal, i) => {
              const isSkipped = skipped.has(i)
              return (
                <button
                  key={meal.recipe_id}
                  onClick={() => !isSkipped && onSelectMeal(meal)}
                  className={`text-left p-5 border rounded-lg bg-bg transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                    isSkipped
                      ? "border-dashed border-line opacity-50"
                      : "border-line hover:border-ink"
                  }`}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest text-muted font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      role="switch"
                      aria-checked={isSkipped}
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleSkip(i) }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleSkip(i) } }}
                      className="text-xs uppercase tracking-widest text-muted hover:text-ink cursor-pointer select-none"
                    >
                      {isSkipped ? "Unskip" : "Skip"}
                    </span>
                  </div>
                  <h3 className={`font-display text-xl mb-4 leading-tight transition-colors ${
                    isSkipped
                      ? "line-through text-muted"
                      : "text-ink group-hover:text-accent"
                  }`}>
                    {meal.title}
                  </h3>
                  <div className="flex gap-4 text-sm font-mono text-muted">
                    <span>{gbp(meal.total_cost_gbp)}</span>
                    <span>{meal.calories_per_serving} kcal</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <CalorieDistribution meals={activeMeals} target={Math.round(calorieTarget)} />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">Cuisine breakdown</p>
              <p className="text-sm text-ink">{cuisineBreakdown}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "shopping" && (
        <div className="animate-in fade-in duration-300">
          <ShoppingListView
            recipeIds={activeMeals.map(m => m.recipe_id)}
            householdSize={householdSize}
          />
        </div>
      )}

      {activeTab === "savings" && (
        <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
          <SavingsHeadline />
          <div className="rounded-lg border-2 border-line bg-bg p-5">
            <BudgetDashboard
              planId={plan.plan_id ?? null}
              meals={plan.meals}
              totalCost={plan.total_cost_gbp}
              budget={plan.budget_gbp}
              budgetUtilization={plan.budget_utilization}
              actualCost={actualCost}
              onActualCostSaved={setActualCost}
            />
          </div>
        </div>
      )}

      {activeTab === "pantry" && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center py-16">
            <p className="text-xs uppercase tracking-widest text-muted mb-3">Pantry</p>
            <p className="font-display text-2xl text-muted mb-2">Coming soon</p>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Track what you already have at home so your plans and shopping lists adjust automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
