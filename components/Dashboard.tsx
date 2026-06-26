"use client"

import { useState, useEffect } from "react"
import type { PlanResponse, PlannedMeal, BudgetSummary } from "@/lib/api"
import { getBudgetSummary } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"
import { CostBreakdownBar } from "./CostBreakdownBar"
import { BudgetGauge } from "./BudgetGauge"
import { ShoppingListView } from "./ShoppingList"
import { Sheet } from "./Sheet"
import { VIBES, buildPlanRequest, INITIAL_STATE } from "@/lib/vibes"
import type { PlanRequest } from "@/lib/api"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const MOCK_PANTRY = [
  { name: "Olive oil", qty: "200ml", low: false },
  { name: "Rice", qty: "1kg", low: false },
  { name: "Onions", qty: "3", low: false },
  { name: "Garlic", qty: "1 bulb", low: true },
  { name: "Tinned tomatoes", qty: "2 tins", low: false },
  { name: "Pasta", qty: "250g", low: true },
  { name: "Soy sauce", qty: "150ml", low: false },
  { name: "Eggs", qty: "4", low: true },
]

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
  onRegenerate: () => void
  lastRequest: PlanRequest | null
}

function getTodayIndex(): number {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

function SavingsHero({ plan, budgetSummary }: { plan: PlanResponse; budgetSummary: BudgetSummary | null }) {
  const saved = plan.budget_gbp - plan.total_cost_gbp
  const isUnder = saved >= 0
  const animatedSaved = useCountUp(Math.abs(saved), 1200, 200)
  const [expanded, setExpanded] = useState(false)

  const streak = budgetSummary
    ? budgetSummary.plans.reduce((count, p) => {
        if (p.actual_cost_gbp !== null && p.actual_cost_gbp <= p.budget_gbp) return count + 1
        if (p.actual_cost_gbp === null && p.projected_cost_gbp <= p.budget_gbp) return count + 1
        return 0
      }, 0)
    : 0

  const sparklineData = budgetSummary
    ? budgetSummary.plans.slice(-8).map(p => p.actual_cost_gbp ?? p.projected_cost_gbp)
    : []
  const sparklineBudget = plan.budget_gbp

  return (
    <section className="mb-10 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
            aria-expanded={expanded}
          >
            <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight ${
              isUnder
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}>
              {isUnder ? "" : "−"}<span className="font-mono">{gbp(animatedSaved)}</span>
              <span className="text-ink text-2xl sm:text-3xl lg:text-4xl ml-2">
                {isUnder ? "under your" : "over your"}{" "}
                <span className="font-mono">{gbp(plan.budget_gbp)}</span> budget
              </span>
            </h2>
          </button>

          <p className="text-sm text-muted mt-2">
            <span className="font-mono">{gbp(plan.total_cost_gbp)}</span> spent of{" "}
            <span className="font-mono">{gbp(plan.budget_gbp)}</span> budget
          </p>

          {streak >= 2 && (
            <p className="text-sm mt-2 text-accent font-medium">
              <span className="mr-1">🔥</span>
              {streak} week{streak !== 1 ? "s" : ""} in a row under budget
            </p>
          )}
        </div>

        {sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} budget={sparklineBudget} />
        )}
      </div>

      {expanded && (
        <div className="mt-4 p-4 rounded-lg bg-chip animate-in fade-in duration-200">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">Savings breakdown</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Reference shop (Aldi-equivalent)</span>
              <span className="font-mono text-ink">{gbp(plan.budget_gbp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Your plan</span>
              <span className="font-mono text-ink">{gbp(plan.total_cost_gbp)}</span>
            </div>
            <hr className="border-line" />
            <div className="flex justify-between font-medium">
              <span className="text-muted">Saved</span>
              <span className={`font-mono ${isUnder ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                {gbp(Math.abs(saved))}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Sparkline({ data, budget }: { data: number[]; budget: number }) {
  const w = 120
  const h = 48
  const pad = 4
  const all = [...data, budget]
  const min = Math.min(...all) * 0.9
  const max = Math.max(...all) * 1.1
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const budgetY = h - pad - ((budget - min) / range) * (h - pad * 2)
  const lastPoint = points[points.length - 1].split(",")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <line
        x1={pad} y1={budgetY} x2={w - pad} y2={budgetY}
        stroke="var(--muted)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 0,
          animation: "sparkline-draw 600ms ease-out forwards",
        }}
      />
      <circle
        cx={lastPoint[0]} cy={lastPoint[1]} r="3"
        fill="var(--accent)"
      />
    </svg>
  )
}

function WeekStrip({
  meals,
  skipped,
  cooked,
  todayIndex,
  highlightedMealIndex,
  onToggleSkip,
  onToggleCooked,
  onSelectMeal,
  onSwapMeal,
  onHoverMeal,
}: {
  meals: PlannedMeal[]
  skipped: Set<number>
  cooked: Set<number>
  todayIndex: number
  highlightedMealIndex: number | null
  onToggleSkip: (i: number) => void
  onToggleCooked: (i: number) => void
  onSelectMeal: (meal: PlannedMeal) => void
  onSwapMeal: (meal: PlannedMeal) => void
  onHoverMeal: (i: number | null) => void
}) {
  return (
    <section className="mb-10">
      <div className="flex overflow-x-auto gap-3 pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
        {meals.map((meal, i) => {
          const isToday = i === todayIndex
          const isSkipped = skipped.has(i)
          const isCooked = cooked.has(i)
          const isHighlighted = highlightedMealIndex === i
          const now = new Date()
          const showCookPill = isToday && !isCooked && !isSkipped && now.getHours() >= 17

          return (
            <div
              key={meal.recipe_id}
              className={`relative flex-shrink-0 w-[140px] sm:w-auto p-3 rounded-lg border-2 transition-all duration-200 group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                isHighlighted
                  ? "border-accent shadow-md scale-[1.02]"
                  : isToday
                    ? "border-accent/50"
                    : "border-line hover:border-card-border-hover"
              } ${isSkipped ? "opacity-50" : ""}`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              onClick={() => !isSkipped && onSelectMeal(meal)}
              onMouseEnter={() => onHoverMeal(i)}
              onMouseLeave={() => onHoverMeal(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isToday ? "text-accent" : "text-muted"}`}>
                  {DAY_NAMES[i] ?? `Day ${i + 1}`}
                </span>
                {isCooked && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-green-600 dark:text-green-400">
                    <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <p className="text-[10px] uppercase tracking-widest text-muted mb-1">{meal.cuisine}</p>

              <h3 className={`text-sm font-display leading-tight mb-2 line-clamp-1 ${
                isSkipped ? "line-through text-muted" : "text-ink"
              }`}>
                {meal.title}
              </h3>

              <p className="text-xs font-mono text-muted">{gbp(meal.total_cost_gbp)}</p>

              {showCookPill && (
                <span className="absolute -top-2 right-2 px-2 py-0.5 bg-accent text-accent-fg text-[10px] rounded-full font-medium">
                  cook tonight
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-bg/90 to-transparent rounded-b-lg">
                <button
                  onClick={(e) => { e.stopPropagation(); onSwapMeal(meal) }}
                  className="p-1 rounded text-muted hover:text-ink transition-colors"
                  title="Swap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSkip(i) }}
                  className="p-1 rounded text-muted hover:text-ink transition-colors"
                  title={isSkipped ? "Unskip" : "Skip"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 5l14 14M5 19L19 5" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleCooked(i) }}
                  className="p-1 rounded text-muted hover:text-ink transition-colors"
                  title={isCooked ? "Unmark cooked" : "Mark cooked"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function QuickActions({
  onOpenShopping,
  onRegenerate,
}: {
  onOpenShopping: () => void
  onRegenerate: () => void
}) {
  const [pantryToast, setPantryToast] = useState(false)
  const [premiumToast, setPremiumToast] = useState(false)

  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenShopping}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-line hover:border-card-border-hover transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="text-xs font-medium text-ink">Shopping list</span>
        </button>

        <button
          onClick={onRegenerate}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-line hover:border-card-border-hover transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" /><path d="M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          <span className="text-xs font-medium text-ink">Regenerate plan</span>
        </button>

        <button
          onClick={() => { setPantryToast(true); setTimeout(() => setPantryToast(false), 2000) }}
          className="relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-line hover:border-card-border-hover transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3z" /><path d="M12 8v8" /><path d="M8 12h8" />
          </svg>
          <span className="text-xs font-medium text-ink">Update pantry</span>
          {pantryToast && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-ink text-bg text-xs rounded-full whitespace-nowrap animate-in fade-in duration-200">
              Coming soon
            </span>
          )}
        </button>

        <button
          onClick={() => { setPremiumToast(true); setTimeout(() => setPremiumToast(false), 2000) }}
          className="relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-line hover:border-card-border-hover transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span className="text-xs font-medium text-ink">What can I make?</span>
          {premiumToast && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-ink text-bg text-xs rounded-full whitespace-nowrap animate-in fade-in duration-200">
              Coming soon — Pantry Premium
            </span>
          )}
        </button>
      </div>
    </section>
  )
}

function CostStory({
  meals,
  budget,
  spent,
  highlightedMealIndex,
  onHoverMealIndex,
}: {
  meals: PlannedMeal[]
  budget: number
  spent: number
  highlightedMealIndex: number | null
  onHoverMealIndex: (i: number | null) => void
}) {
  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-widest text-muted mb-4">The cost story</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostBreakdownBar
          meals={meals}
          budget={budget}
          highlightedMealIndex={highlightedMealIndex}
          onHoverMealIndex={onHoverMealIndex}
        />
        <BudgetGauge spent={spent} budget={budget} />
      </div>
    </section>
  )
}

function PantryHealth() {
  const [toast, setToast] = useState(false)

  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-widest text-muted mb-4">Pantry health</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {MOCK_PANTRY.map((item) => (
          <div
            key={item.name}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-chip border border-line text-sm"
          >
            {item.low && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
            <span className="text-ink">{item.name}</span>
            <span className="font-mono text-xs text-muted">{item.qty}</span>
          </div>
        ))}
        <button
          onClick={() => { setToast(true); setTimeout(() => setToast(false), 2000) }}
          className="relative flex-shrink-0 px-4 py-2 rounded-full border-2 border-accent text-accent text-sm font-medium hover:bg-accent hover:text-accent-fg transition-colors whitespace-nowrap"
        >
          Quick check-in (30s)
          {toast && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-ink text-bg text-xs rounded-full whitespace-nowrap animate-in fade-in duration-200">
              Coming soon
            </span>
          )}
        </button>
      </div>
    </section>
  )
}

function CumulativeSavings({ budgetSummary }: { budgetSummary: BudgetSummary | null }) {
  if (!budgetSummary || budgetSummary.plans.length < 3) return null

  const totalSaved = budgetSummary.plans.reduce((sum, p) => {
    const cost = p.actual_cost_gbp ?? p.projected_cost_gbp
    return sum + (p.budget_gbp - cost)
  }, 0)

  if (totalSaved <= 0) return null

  return <CumulativeSavingsInner totalSaved={totalSaved} budgetSummary={budgetSummary} />
}

function CumulativeSavingsInner({ totalSaved, budgetSummary }: { totalSaved: number; budgetSummary: BudgetSummary }) {
  const animatedTotal = useCountUp(totalSaved, 1500, 400)
  const weeklyData = budgetSummary.plans.slice(-8)
  const budget = weeklyData[0]?.budget_gbp ?? 0

  const w = 320
  const h = 120
  const pad = 24
  const values = weeklyData.map(p => p.actual_cost_gbp ?? p.projected_cost_gbp)
  const all = [...values, budget]
  const min = Math.min(...all) * 0.85
  const max = Math.max(...all) * 1.15
  const range = max - min || 1

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const budgetY = h - pad - ((budget - min) / range) * (h - pad * 2)

  return (
    <section className="mb-10 animate-in fade-in duration-500" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
      <div className="p-6 rounded-lg border-2 border-line bg-bg">
        <p className="font-display text-2xl sm:text-3xl text-ink mb-2">
          You&apos;ve saved <span className="font-mono text-green-600 dark:text-green-400">{gbp(animatedTotal)}</span> since you started Pantry
        </p>

        <div className="flex justify-center my-4">
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[320px]">
            <line
              x1={pad} y1={budgetY} x2={w - pad} y2={budgetY}
              stroke="var(--muted)" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"
            />
            <text x={w - pad + 4} y={budgetY + 3} style={{ fontSize: "9px", fill: "var(--muted)" }}>budget</text>
            <polyline
              points={points.join(" ")}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => {
              const [cx, cy] = p.split(",")
              return <circle key={i} cx={cx} cy={cy} r="3" fill="var(--accent)" />
            })}
          </svg>
        </div>

        <p className="text-xs text-muted text-center">
          Based on {budgetSummary.plans.length} week{budgetSummary.plans.length !== 1 ? "s" : ""} of plans vs reference shop prices.
        </p>
      </div>
    </section>
  )
}

function VibeSelector({ onSubmit }: { onSubmit: (req: PlanRequest) => void }) {
  const quickVibes = VIBES.filter(v => ["quick", "comfort", "fakeaway"].includes(v.id))

  const handleVibe = (vibeId: string) => {
    const state = { ...INITIAL_STATE, selectedVibes: [vibeId] }
    onSubmit(buildPlanRequest(state))
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in duration-500">
      <h2 className="font-display text-3xl sm:text-4xl text-ink mb-3">
        What kind of week is this?
      </h2>
      <p className="text-muted mb-8">Pick a vibe and we&apos;ll plan your meals instantly.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickVibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => handleVibe(vibe.id)}
            className="p-6 rounded-lg border-2 border-line hover:border-accent text-left transition-colors group"
          >
            <h3 className="font-display text-lg text-ink group-hover:text-accent transition-colors mb-1">
              {vibe.label}
            </h3>
            <p className="text-sm text-muted">{vibe.description}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted mt-6">
        Or{" "}
        <button onClick={() => handleVibe("quick")} className="underline hover:text-ink transition-colors">
          surprise me
        </button>
      </p>
    </div>
  )
}

export function Dashboard({
  plan,
  calorieTarget,
  householdSize,
  onSelectMeal,
  onReset,
  onRegenerate,
  lastRequest,
}: Props) {
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [cooked, setCooked] = useState<Set<number>>(new Set())
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [highlightedMealIndex, setHighlightedMealIndex] = useState<number | null>(null)
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const todayIndex = getTodayIndex()
  const activeMeals = plan.meals.filter((_, i) => !skipped.has(i))
  const activeCost = activeMeals.reduce((s, m) => s + m.total_cost_gbp, 0)

  useEffect(() => {
    let cancelled = false
    getBudgetSummary()
      .then((data) => { if (!cancelled) setBudgetSummary(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const toggleSkip = (i: number) => {
    setSkipped(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const toggleCooked = (i: number) => {
    setCooked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-800">
      {/* Section 1: Savings Hero */}
      <SavingsHero plan={plan} budgetSummary={budgetSummary} />

      {/* Section 2: Week Strip */}
      <WeekStrip
        meals={plan.meals}
        skipped={skipped}
        cooked={cooked}
        todayIndex={todayIndex}
        highlightedMealIndex={highlightedMealIndex}
        onToggleSkip={toggleSkip}
        onToggleCooked={toggleCooked}
        onSelectMeal={onSelectMeal}
        onSwapMeal={onSelectMeal}
        onHoverMeal={setHighlightedMealIndex}
      />

      {/* Section 3: Quick Actions */}
      <QuickActions
        onOpenShopping={() => setShoppingOpen(true)}
        onRegenerate={onRegenerate}
      />

      {/* Section 4: Cost Story */}
      <CostStory
        meals={activeMeals}
        budget={plan.budget_gbp}
        spent={activeCost}
        highlightedMealIndex={highlightedMealIndex}
        onHoverMealIndex={setHighlightedMealIndex}
      />

      {/* Section 5: Pantry Health (placeholder) */}
      <PantryHealth />

      {/* Section 6: Cumulative Savings */}
      <CumulativeSavings budgetSummary={budgetSummary} />

      {/* Section 7: Recipes you've loved — future handoff */}
      {/* TODO: Section 7 — Recipes you've loved. Requires recipe feedback (👍/👎/🔥) which isn't built yet. */}

      {/* Shopping list slide-over */}
      <Sheet
        open={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        title="Shopping list"
        contentKey="shopping"
        width="wide"
      >
        <ShoppingListView
          recipeIds={activeMeals.map(m => m.recipe_id)}
          householdSize={householdSize}
        />
      </Sheet>
    </div>
  )
}

export { VibeSelector }
