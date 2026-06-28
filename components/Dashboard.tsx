"use client"

import { useState } from "react"
import Image from "next/image"
import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useCountUp } from "@/lib/useCountUp"
import { ShoppingListView } from "./ShoppingList"
import { Sheet } from "./Sheet"
import { VIBES } from "@/lib/vibes"
import type { PlanRequest } from "@/lib/api"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CUISINE_IMAGES: Record<string, string> = {
  british: "https://images.unsplash.com/photo-1579208030886-b1f5b7b4deb2?w=200&h=200&fit=crop",
  italian: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop",
  indian: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop",
  chinese: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop",
  mexican: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200&h=200&fit=crop",
  japanese: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop",
  mediterranean: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
  african: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=200&h=200&fit=crop",
  middle_eastern: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&h=200&fit=crop",
  american: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
  korean: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop",
  french: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop",
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200&h=200&fit=crop"

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
  lastRequest: PlanRequest | null
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
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const todayIndex = getTodayIndex()
  const activeMeals = plan.meals.filter((_, i) => !skipped.has(i))

  const saved = plan.budget_gbp - plan.total_cost_gbp
  const isUnder = saved >= 0
  const animatedSaved = useCountUp(Math.abs(saved), 1200, 200)

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
        <h2 className={`font-display text-4xl md:text-5xl tracking-tight ${
          isUnder
            ? "text-green-600 dark:text-green-400"
            : "text-red-500 dark:text-red-400"
        }`}>
          {isUnder ? "" : "−"}<span className="font-mono">{gbp(animatedSaved)}</span>
        </h2>
        <p className={`font-display text-xl md:text-2xl text-ink mt-1 ${
          isUnder ? "" : ""
        }`}>
          {isUnder ? "under" : "over"} your <span className="font-mono">{gbp(plan.budget_gbp)}</span> budget
        </p>
        <p className="text-sm text-muted mt-2">
          <span className="font-mono">{gbp(plan.total_cost_gbp)}</span> total for {plan.meals.length} meals
        </p>
      </section>

      {/* Meal List */}
      <section className="mb-10">
        <div className="space-y-2">
          {plan.meals.map((meal, i) => {
            const isToday = i === todayIndex
            const isSkipped = skipped.has(i)

            return (
              <button
                key={meal.recipe_id}
                onClick={() => !isSkipped && onSelectMeal(meal)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left ${
                  isToday
                    ? "bg-accent/5 border border-accent/20"
                    : "hover:bg-chip border border-transparent"
                } ${isSkipped ? "opacity-40" : ""}`}
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-line">
                  <Image
                    src={getMealImage(meal.cuisine)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted">
                    {DAY_NAMES[i] ?? `Day ${i + 1}`}
                    {isToday && <span className="text-accent ml-1.5 font-medium">Today</span>}
                  </p>
                  <h3 className={`text-base font-display leading-tight truncate ${
                    isSkipped ? "line-through text-muted" : "text-ink"
                  }`}>
                    {meal.title}
                  </h3>
                </div>

                <span className="text-sm font-mono text-muted flex-shrink-0">
                  {gbp(meal.total_cost_gbp)}
                </span>
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
          onClick={onRegenerate}
          className="w-full py-4 rounded-xl border-2 border-line text-ink text-lg font-semibold hover:border-ink transition-colors"
        >
          Regenerate plan
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
