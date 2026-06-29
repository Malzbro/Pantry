"use client"

import Image from "next/image"
import { ArrowRight, ChefHat, ShoppingCart, Sparkles, Wallet } from "lucide-react"
import type { PlanResponse, PlanRequest } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { SavingsHeadline } from "./SavingsHeadline"

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

function firstName(email: string): string {
  const local = email.split("@")[0] ?? ""
  const first = local.split(/[._-]/)[0] ?? local
  if (!first) return ""
  return first.charAt(0).toUpperCase() + first.slice(1)
}

type Props = {
  userEmail: string
  plan: PlanResponse | null
  savedRequest: PlanRequest | null
  onViewPlan: () => void
  onOpenShoppingList: () => void
  onNewPlan: () => void
  onQuickGenerate: () => void
}

export function HomePage({
  userEmail,
  plan,
  savedRequest,
  onViewPlan,
  onOpenShoppingList,
  onNewPlan,
  onQuickGenerate,
}: Props) {
  const name = firstName(userEmail)
  const today = getTodayIndex()

  return (
    <div className="max-w-2xl mx-auto px-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted mb-2">Home</p>
        <h1 className="font-display text-3xl md:text-4xl text-ink">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </h1>
        <p className="text-muted text-sm mt-2">
          {plan
            ? "Here's your week at a glance."
            : "Let's plan your week."}
        </p>
      </header>

      <SavingsHeadline />

      {plan ? (
        <CurrentPlanCard
          plan={plan}
          todayIndex={today}
          onViewPlan={onViewPlan}
        />
      ) : (
        <NoPlanCard
          hasSavedPreferences={!!savedRequest}
          onNewPlan={onNewPlan}
          onQuickGenerate={onQuickGenerate}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <ActionCard
          icon={<ShoppingCart size={20} />}
          title="Shopping list"
          description={plan ? `${plan.meals.length} meals to shop for` : "Generate a plan to see it"}
          disabled={!plan}
          onClick={onOpenShoppingList}
        />
        <ActionCard
          icon={<Wallet size={20} />}
          title="Budget"
          description={
            plan
              ? `${gbp(plan.total_cost_gbp)} of ${gbp(plan.budget_gbp)}`
              : "Set a weekly budget when planning"
          }
          disabled={!plan}
          onClick={onViewPlan}
        />
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onNewPlan}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
        >
          <Sparkles size={14} />
          {plan ? "Start a new plan" : "Customise from scratch"}
        </button>
      </div>
    </div>
  )
}

function CurrentPlanCard({
  plan,
  todayIndex,
  onViewPlan,
}: {
  plan: PlanResponse
  todayIndex: number
  onViewPlan: () => void
}) {
  const isUnder = plan.total_cost_gbp <= plan.budget_gbp
  const pct = plan.budget_gbp > 0
    ? Math.min(100, Math.round((plan.total_cost_gbp / plan.budget_gbp) * 100))
    : 0
  const preview = plan.meals.slice(0, 3)

  return (
    <section className="rounded-2xl border border-line bg-bg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-1">Current plan</p>
          <h2 className="font-display text-xl text-ink">{plan.meals.length} meals this week</h2>
        </div>
        <div className="text-right">
          <p className={`font-mono text-lg font-medium ${isUnder ? "text-ink" : "text-red-500 dark:text-red-400"}`}>
            {gbp(plan.total_cost_gbp)}
          </p>
          <p className="text-xs text-muted">of {gbp(plan.budget_gbp)}</p>
        </div>
      </div>

      <div className="h-1.5 bg-chip rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isUnder ? "bg-accent" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2 mb-5">
        {preview.map((meal, i) => {
          const isToday = i === todayIndex
          return (
            <div
              key={meal.recipe_id}
              className="flex items-center gap-3 p-2 rounded-lg bg-chip/40"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5">
                <Image
                  src={getMealImage(meal.cuisine)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-medium">
                    {DAY_NAMES[i] ?? `Day ${i + 1}`}
                  </p>
                  {isToday && (
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-accent-fg bg-accent px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink truncate">{meal.title}</p>
              </div>
              <span className="text-xs font-mono text-muted flex-shrink-0">
                {gbp(meal.total_cost_gbp)}
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={onViewPlan}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-fg font-semibold hover:opacity-90 transition-opacity"
      >
        View full plan
        <ArrowRight size={16} />
      </button>
    </section>
  )
}

function NoPlanCard({
  hasSavedPreferences,
  onNewPlan,
  onQuickGenerate,
}: {
  hasSavedPreferences: boolean
  onNewPlan: () => void
  onQuickGenerate: () => void
}) {
  return (
    <section className="rounded-2xl border border-line bg-bg p-6 shadow-sm text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
        <ChefHat size={22} />
      </div>
      <h2 className="font-display text-xl text-ink mb-2">No plan yet</h2>
      <p className="text-sm text-muted mb-5">
        Generate a week of meals tailored to your budget and tastes.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {hasSavedPreferences && (
          <button
            onClick={onQuickGenerate}
            className="px-5 py-3 rounded-xl bg-accent text-accent-fg font-semibold hover:opacity-90 transition-opacity"
          >
            Quick generate
          </button>
        )}
        <button
          onClick={onNewPlan}
          className={`px-5 py-3 rounded-xl font-semibold transition-colors ${
            hasSavedPreferences
              ? "border-2 border-line text-ink hover:border-ink"
              : "bg-accent text-accent-fg hover:opacity-90"
          }`}
        >
          {hasSavedPreferences ? "Customise" : "Create your first plan"}
        </button>
      </div>
    </section>
  )
}

function ActionCard({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-4 rounded-xl border border-line bg-bg transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:border-ink/40 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 text-accent">
        {icon}
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <p className="text-xs text-muted">{description}</p>
    </button>
  )
}
