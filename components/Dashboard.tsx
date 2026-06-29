"use client"

import { useState } from "react"
import Image from "next/image"
import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"
import { ShoppingListView } from "./ShoppingList"
import { Sheet } from "./Sheet"
import { PantrySheet } from "./PantrySheet"
import { VIBES } from "@/lib/vibes"
import type { PlanRequest } from "@/lib/api"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CUISINE_IMAGES: Record<string, string> = {
  british: "https://images.unsplash.com/photo-1579208030886-b1f5b7b4deb2?w=400&h=400&fit=crop",
  italian: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
  indian: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop",
  chinese: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop",
  mexican: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop",
  japanese: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop",
  mediterranean: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
  african: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop",
  middle_eastern: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop",
  american: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  korean: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop",
  french: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=400&fit=crop"

function getMealImage(cuisine: string): string {
  return CUISINE_IMAGES[cuisine.toLowerCase()] ?? FALLBACK_IMAGE
}

function getTodayIndex(): number {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
  onRegenerate: () => void
  onCopyPlan: () => void
  lastRequest: PlanRequest | null
}

export function Dashboard({
  plan,
  calorieTarget,
  householdSize,
  onSelectMeal,
  onReset,
  onRegenerate,
  onCopyPlan,
  lastRequest,
}: Props) {
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [pantryOpen, setPantryOpen] = useState(false)
  const todayIndex = getTodayIndex()
  const activeMeals = plan.meals.filter((_, i) => !skipped.has(i))

  const saved = plan.budget_gbp - plan.total_cost_gbp
  const isUnder = saved >= 0
  const animatedTotal = useCountUp(plan.total_cost_gbp, 1400, 200)
  const pctOfBudget = plan.budget_gbp > 0
    ? Math.min(100, Math.round((plan.total_cost_gbp / plan.budget_gbp) * 100))
    : 0

  const toggleSkip = (i: number) => {
    setSkipped(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="max-w-xl mx-auto px-6 animate-in fade-in duration-800">
      {/* Budget Summary */}
      <section className="text-center py-8 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted mb-2">Plan total</p>
        <h2 className={`font-display text-5xl md:text-6xl tracking-tight ${
          isUnder
            ? "text-ink"
            : "text-red-500 dark:text-red-400"
        }`}>
          <span className="font-mono tabular-nums">{gbp(animatedTotal)}</span>
        </h2>
        <p className="text-sm text-muted mt-3">
          of <span className="font-mono">{gbp(plan.budget_gbp)}</span> budget · {plan.meals.length} meals
        </p>
        <div className="h-1.5 bg-chip rounded-full overflow-hidden mt-4 max-w-xs mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-[1400ms] ease-out ${
              isUnder ? "bg-accent" : "bg-red-500"
            }`}
            style={{ width: `${pctOfBudget}%` }}
          />
        </div>
      </section>

      {/* Meal List */}
      <section className="mb-10">
        <div className="space-y-3">
          {plan.meals.map((meal, i) => {
            const isToday = i === todayIndex
            const isSkipped = skipped.has(i)

            return (
              <button
                key={meal.recipe_id}
                onClick={() => !isSkipped && onSelectMeal(meal)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 ${
                  isToday
                    ? "bg-accent/8 border-2 border-accent/40 shadow-md"
                    : "bg-bg border border-line shadow-sm hover:shadow-md hover:border-ink/40 hover:-translate-y-0.5"
                } ${isSkipped ? "opacity-40" : ""}`}
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md ring-1 ring-black/5">
                  <Image
                    src={getMealImage(meal.cuisine)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] uppercase tracking-widest text-muted font-medium">
                      {DAY_NAMES[i] ?? `Day ${i + 1}`}
                    </p>
                    {isToday && (
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-accent-fg bg-accent px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <h3 className={`text-lg font-display leading-snug mt-1.5 line-clamp-2 ${
                    isSkipped ? "line-through text-muted" : "text-ink"
                  }`}>
                    {meal.title}
                  </h3>
                  <p className="text-sm text-muted mt-1.5 capitalize">{meal.cuisine}</p>
                  <p className="text-sm font-mono text-ink font-medium mt-2">
                    {gbp(meal.total_cost_gbp)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Bottom Actions */}
      <section className="space-y-3 pb-8">
        <button
          onClick={() => setShoppingOpen(true)}
          className="w-full py-4 rounded-xl bg-accent text-accent-fg text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Shopping list
        </button>
        <button
          onClick={() => setPantryOpen(true)}
          className="w-full py-4 rounded-xl border-2 border-line text-ink text-lg font-semibold hover:border-ink transition-colors"
        >
          Pantry
        </button>
        <button
          onClick={onRegenerate}
          className="w-full py-4 rounded-xl border-2 border-line text-ink text-lg font-semibold hover:border-ink transition-colors"
        >
          Regenerate plan
        </button>
        <button
          onClick={onCopyPlan}
          className="w-full py-3 text-sm text-muted hover:text-accent transition-colors"
        >
          Reuse a past plan
        </button>
      </section>

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

      <Sheet
        open={pantryOpen}
        onClose={() => setPantryOpen(false)}
        title="Pantry"
        contentKey="pantry"
        width="narrow"
      >
        <PantrySheet />
      </Sheet>
    </div>
  )
}

/* VibeSelector — kept as-is for returning users */
export function VibeSelector({ savedRequest, onSubmit, onCustomise, onReset }: {
  savedRequest: PlanRequest
  onSubmit: (req: PlanRequest) => void
  onCustomise: () => void
  onReset: () => void
}) {
  const displayVibes = VIBES.slice(0, 6)

  const handleVibe = (vibeId: string) => {
    const vibe = VIBES.find(v => v.id === vibeId)
    if (!vibe) return
    const vibePrefText = [savedRequest.preference_text, vibe.preferenceText].filter(Boolean).join(". ")
    onSubmit({
      ...savedRequest,
      preferred_cuisines: Array.from(new Set([...savedRequest.preferred_cuisines, ...vibe.cuisineBias])),
      required_tags: Array.from(new Set([...savedRequest.required_tags, ...vibe.dietaryTags])),
      preference_text: vibePrefText,
    })
  }

  return (
    <div className="max-w-xl mx-auto px-6 text-center py-12 animate-in fade-in duration-500">
      <h2 className="font-display text-4xl md:text-5xl text-ink mb-3">
        What kind of week?
      </h2>
      <p className="text-muted text-lg mb-8">Pick a vibe and we&apos;ll plan instantly.</p>

      <div className="grid grid-cols-2 gap-4">
        {displayVibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => handleVibe(vibe.id)}
            className="p-5 rounded-xl border border-line hover:border-accent text-left transition-colors group"
          >
            <h3 className="font-display text-lg text-ink group-hover:text-accent transition-colors mb-1">
              {vibe.label}
            </h3>
            <p className="text-sm text-muted">{vibe.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8 text-sm text-muted">
        <button onClick={() => handleVibe("quick")} className="underline hover:text-ink transition-colors">
          Surprise me
        </button>
        <span>or</span>
        <button onClick={onCustomise} className="underline hover:text-ink transition-colors">
          Customise plan
        </button>
      </div>

      <div className="mt-6 text-center">
        <button onClick={onReset} className="text-xs text-muted hover:text-accent transition-colors">
          Reset preferences and start fresh
        </button>
      </div>
    </div>
  )
}
