"use client"

import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useState } from "react"
import { useCountUp } from "@/lib/useCountUp"
import { CalorieDistribution } from "./CalorieDistribution"
import { ShoppingListView } from "./ShoppingList"
import { Sheet } from "./Sheet"
import { BudgetDashboard } from "./BudgetDashboard"
import { SavingsHeadline } from "./SavingsHeadline"
import { PantrySheet } from "./PantrySheet"

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
}

type ActiveCard = "budget" | "shopping" | "pantry" | "stats" | null

export function PlanView({ plan, calorieTarget, householdSize, onSelectMeal, onReset }: Props) {
  const [active, setActive] = useState<ActiveCard>(null)
  const [actualCost, setActualCost] = useState<number | null>(null)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  const activeMeals = plan.meals.filter((_, i) => !skipped.has(i))
  const activeCost = activeMeals.reduce((s, m) => s + m.total_cost_gbp, 0)
  const activePct = plan.budget_gbp > 0 ? Math.round((activeCost / plan.budget_gbp) * 100) : 0

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

  const cardLayout = "text-left p-5 rounded-lg bg-bg transition-all duration-200"
  const cardActive = "border-2 border-accent shadow-md"
  const cardInactive = "border-2 border-[#D9D3C7] shadow-sm hover:border-[#B0A893] hover:shadow-md"
  const eyebrow = "text-xs uppercase tracking-widest text-muted"

  const sheetTitle =
    active === "budget" ? "Budget"
    : active === "shopping" ? "Shopping list"
    : active === "pantry" ? "Pantry"
    : active === "stats" ? "Stats"
    : ""

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-800">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onReset} className="text-sm text-muted hover:text-ink transition-colors">
          ← Start over
        </button>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl text-ink">
          Your week — {activeMeals.length} meal{activeMeals.length !== 1 ? "s" : ""},{" "}
          <span className="font-mono">{gbp(animatedCost)}</span> total
        </h2>
        {skipped.size > 0 && (
          <p className="text-sm text-muted mt-1">
            {skipped.size} night{skipped.size !== 1 ? "s" : ""} skipped
          </p>
        )}
      </div>

      <SavingsHeadline />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={() => setActive(active === "budget" ? null : "budget")}
          className={`${cardLayout} ${active === "budget" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Budget</p>
          <p className="font-mono text-lg text-ink mt-2">
            {gbp(activeCost)} <span className="text-muted">of</span> {gbp(plan.budget_gbp)}
          </p>
          <p className="text-sm text-muted mt-1">
            {actualCost !== null
              ? `Actual: ${gbp(actualCost)}`
              : `${activePct}% allocated`}
          </p>
          <div className="h-1 bg-chip rounded-sm overflow-hidden mt-3">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, activePct)}%` }} />
          </div>
        </button>

        <button
          onClick={() => setActive(active === "shopping" ? null : "shopping")}
          className={`${cardLayout} ${active === "shopping" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Shopping list</p>
          <p className="font-mono text-lg text-ink mt-2">{activeMeals.length} recipe{activeMeals.length !== 1 ? "s" : ""}</p>
          <p className="text-sm text-muted mt-1">Tap to view ingredients</p>
        </button>

        <button
          onClick={() => setActive(active === "pantry" ? null : "pantry")}
          className={`${cardLayout} ${active === "pantry" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Pantry</p>
          <p className="font-mono text-lg text-ink mt-2">What you have</p>
          <p className="text-sm text-muted mt-1">Tap to manage</p>
        </button>

        <button
          onClick={() => setActive(active === "stats" ? null : "stats")}
          className={`${cardLayout} ${active === "stats" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Stats</p>
          <p className="font-mono text-lg text-ink mt-2">
            {activeMeals.length > 0
              ? Math.round(activeMeals.reduce((s, m) => s + m.calories_per_serving, 0) / activeMeals.length)
              : 0} kcal avg
          </p>
          <p className="text-sm text-muted mt-1">{new Set(activeMeals.map(m => m.cuisine)).size} cuisines</p>
        </button>
      </div>

      {plan.warnings.length > 0 && (
        <div className="mb-8 p-4 border border-line rounded-md bg-chip">
          {plan.warnings.map((w, i) => (
            <p key={i} className="text-sm text-ink">{w}</p>
          ))}
        </div>
      )}

      <hr className="border-line mb-8" />

      <div className="grid sm:grid-cols-2 gap-4">
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

      <Sheet
        open={active !== null}
        onClose={() => setActive(null)}
        title={sheetTitle}
        contentKey={active ?? "none"}
        width={active === "shopping" ? "wide" : "narrow"}
      >
        {active === "budget" && (
          <BudgetDashboard
            planId={plan.plan_id ?? null}
            meals={plan.meals}
            totalCost={plan.total_cost_gbp}
            budget={plan.budget_gbp}
            budgetUtilization={plan.budget_utilization}
            actualCost={actualCost}
            onActualCostSaved={setActualCost}
          />
        )}

        {active === "shopping" && (
          <ShoppingListView
            recipeIds={activeMeals.map(m => m.recipe_id)}
            householdSize={householdSize}
          />
        )}

        {active === "pantry" && <PantrySheet />}

        {active === "stats" && (
          <div className="space-y-6">
            <CalorieDistribution meals={activeMeals} target={Math.round(calorieTarget)} />
            <div>
              <p className={`${eyebrow} mb-2`}>Cuisine breakdown</p>
              <p className="text-sm text-ink">{cuisineBreakdown}</p>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
