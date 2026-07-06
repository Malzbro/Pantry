"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ChefHat, Package, ShoppingCart, Sparkles, Wallet } from "lucide-react"
import type { PlanResponse, PlanRequest } from "@/lib/api"
import { Sheet } from "./Sheet"
import { PantrySheet } from "./PantrySheet"
import { ShoppingListView } from "./ShoppingList"
import { gbp } from "@/lib/utils"
import { getMealDays } from "@/lib/planDays"
import { getMealImage } from "@/lib/mealImage"
import { SavingsHeadline } from "./SavingsHeadline"

function firstName(email: string): string {
  const local = email.split("@")[0] ?? ""
  const first = local.split(/[._-]/)[0] ?? local
  if (!first) return ""
  return first.charAt(0).toUpperCase() + first.slice(1)
}

type Props = {
  userEmail: string
  userName: string
  householdSize: number
  plan: PlanResponse | null
  planCreatedAt: string | null
  savedRequest: PlanRequest | null
  onViewPlan: () => void
  onNewPlan: () => void
  onQuickGenerate: () => void
  onCopyPlan: () => void
}

export function HomePage({
  userEmail,
  userName,
  householdSize,
  plan,
  planCreatedAt,
  savedRequest,
  onViewPlan,
  onNewPlan,
  onQuickGenerate,
  onCopyPlan,
}: Props) {
  const [pantryOpen, setPantryOpen] = useState(false)
  const [shoppingOpen, setShoppingOpen] = useState(false)
  // Prefer the name the user set on their account; fall back to their email handle.
  const name = userName.trim() || firstName(userEmail)

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
          planCreatedAt={planCreatedAt}
          onViewPlan={onViewPlan}
        />
      ) : (
        <NoPlanCard
          hasSavedPreferences={!!savedRequest}
          onNewPlan={onNewPlan}
          onQuickGenerate={onQuickGenerate}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <ActionCard
          icon={<ShoppingCart size={20} />}
          title="Shopping list"
          description={plan ? `${plan.meals.length} meals to shop for` : "Generate a plan to see it"}
          disabled={!plan}
          onClick={() => setShoppingOpen(true)}
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
        <ActionCard
          icon={<Package size={20} />}
          title="Pantry"
          description="Manage what you have at home"
          disabled={false}
          onClick={() => setPantryOpen(true)}
        />
      </div>

      <Sheet
        open={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        title="Shopping list"
        contentKey="shopping"
        width="wide"
      >
        {plan && (
          <ShoppingListView
            recipeIds={plan.meals.map((m) => m.recipe_id)}
            householdSize={householdSize}
          />
        )}
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

      <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted">
        <button
          onClick={onNewPlan}
          className="inline-flex items-center gap-2 hover:text-accent transition-colors"
        >
          <Sparkles size={14} />
          {plan ? "Start a new plan" : "Customise from scratch"}
        </button>
        <span>·</span>
        <button
          onClick={onCopyPlan}
          className="hover:text-accent transition-colors"
        >
          Reuse a past plan
        </button>
      </div>
    </div>
  )
}

function CurrentPlanCard({
  plan,
  planCreatedAt,
  onViewPlan,
}: {
  plan: PlanResponse
  planCreatedAt: string | null
  onViewPlan: () => void
}) {
  const isUnder = plan.total_cost_gbp <= plan.budget_gbp
  const pct = plan.budget_gbp > 0
    ? Math.min(100, Math.round((plan.total_cost_gbp / plan.budget_gbp) * 100))
    : 0
  const mealDays = getMealDays(planCreatedAt, plan.meals.length)
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
          const isToday = mealDays[i]?.isToday ?? false
          return (
            <div
              key={meal.recipe_id}
              className="flex items-center gap-3 p-2 rounded-lg bg-chip/40"
            >
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5">
                <Image
                  src={getMealImage(meal)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 64px, 48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-medium">
                    {mealDays[i]?.label ?? `Day ${i + 1}`}
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
      className={`text-left p-4 md:p-6 md:min-h-[150px] md:flex md:flex-col md:justify-center rounded-xl border border-line bg-bg transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:border-ink/40 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 md:mb-2 text-accent">
        {icon}
        <p className="text-sm md:text-base font-semibold text-ink">{title}</p>
      </div>
      <p className="text-xs md:text-sm text-muted">{description}</p>
    </button>
  )
}
