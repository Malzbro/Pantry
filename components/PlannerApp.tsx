"use client"

import { useState, useEffect } from "react"
import { PlannerWizard } from "@/components/PlannerWizard"
import { Dashboard } from "@/components/Dashboard"
import { PlanSkeleton } from "@/components/PlanSkeleton"
import { RecipeModal } from "@/components/RecipeModal"
import posthog from "posthog-js"
import { createPlan, type PlanRequest, type PlanResponse, type PlannedMeal } from "@/lib/api"
import { PlanReveal } from "@/components/PlanReveal"
import { HeaderMenu } from "@/components/HeaderMenu"
import { HomePage } from "@/components/HomePage"
import { SubscriptionProvider, useSubscription } from "@/components/SubscriptionContext"
import { saveLastPlanRequest, loadLastPlanRequest } from "@/lib/vibes"

type View = "home" | "wizard" | "plan"

export function PlannerApp({ userEmail }: { userEmail: string }) {
  return (
    <SubscriptionProvider>
      <PlannerAppInner userEmail={userEmail} />
    </SubscriptionProvider>
  )
}

function PlannerAppInner({ userEmail }: { userEmail: string }) {
  const { isPremium } = useSubscription()
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [view, setView] = useState<View>("home")
  const [savedRequest, setSavedRequest] = useState<PlanRequest | null>(null)

  useEffect(() => {
    setSavedRequest(loadLastPlanRequest())
  }, [])

  const handleSubmit = async (req: PlanRequest) => {
    setLoading(true)
    setError(null)
    setPlan(null)
    setLastRequest(req)
    try {
      const result = await createPlan(req)
      setPlan(result)
      setShowReveal(true)
      setView("plan")
      saveLastPlanRequest(req)
      setSavedRequest(req)
      posthog.capture("plan_generated", {
        budget_gbp: req.weekly_budget_gbp,
        household_size: req.household_size,
        meals_per_week: req.meals_per_week,
        total_cost_gbp: result.total_cost_gbp,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    if (lastRequest) {
      handleSubmit(lastRequest)
    }
  }

  const handleSwapped = (mealIndex: number, newMeal: PlannedMeal) => {
    if (!plan) return
    const newMeals = [...plan.meals]
    newMeals[mealIndex] = newMeal
    const newTotal = newMeals.reduce((sum, m) => sum + m.total_cost_gbp, 0)
    const newAvgCal = newMeals.reduce((sum, m) => sum + m.calories_per_serving, 0) / newMeals.length
    setPlan({
      ...plan,
      meals: newMeals,
      total_cost_gbp: Math.round(newTotal * 100) / 100,
      budget_utilization: Math.round((newTotal / plan.budget_gbp) * 1000) / 1000,
      avg_calories_per_serving: Math.round(newAvgCal * 10) / 10,
      cuisine_diversity: new Set(newMeals.map(m => m.cuisine)).size,
    })
  }

  const openWizard = () => {
    setView("wizard")
    setShowReveal(false)
  }

  const goHome = () => {
    setView("home")
    setShowReveal(false)
  }

  const goToPlan = () => {
    if (plan) {
      setView("plan")
      setShowReveal(false)
    }
  }

  const quickGenerate = () => {
    if (savedRequest) handleSubmit(savedRequest)
  }

  const openShoppingList = () => {
    if (!plan) return
    setView("plan")
    setShowReveal(false)
  }

  const renderContent = () => {
    if (loading) return <PlanSkeleton />

    if (view === "wizard") {
      return <PlannerWizard onSubmit={handleSubmit} loading={loading} />
    }

    if (view === "plan" && plan) {
      return (
        <Dashboard
          plan={plan}
          calorieTarget={lastRequest?.target_calories_per_serving ?? plan.avg_calories_per_serving}
          householdSize={lastRequest?.household_size ?? 1}
          onSelectMeal={(m: PlannedMeal) => setSelectedRecipeId(m.recipe_id)}
          onReset={goHome}
          onRegenerate={handleRegenerate}
          lastRequest={lastRequest}
        />
      )
    }

    return (
      <HomePage
        userEmail={userEmail}
        plan={plan}
        savedRequest={savedRequest}
        onViewPlan={goToPlan}
        onOpenShoppingList={openShoppingList}
        onNewPlan={openWizard}
        onQuickGenerate={quickGenerate}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <button
            onClick={goHome}
            className="font-display text-lg text-ink hover:text-accent transition-colors"
            aria-label="Go to home"
          >
            Pantry
          </button>
          <HeaderMenu
            userEmail={userEmail}
            isPremium={isPremium}
            hasPlan={!!plan}
            onHome={goHome}
            onNewPlan={openWizard}
          />
        </div>
      </header>

      <main className="container py-12 sm:py-20">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 border border-accent rounded-md text-accent">
            {error}
          </div>
        )}

        {renderContent()}
      </main>

      {plan && showReveal && (
        <PlanReveal plan={plan} onComplete={() => setShowReveal(false)} />
      )}

      <RecipeModal
        recipeId={selectedRecipeId}
        planContext={lastRequest}
        currentMeals={plan?.meals ?? []}
        onClose={() => setSelectedRecipeId(null)}
        onSwapped={handleSwapped}
      />

      <footer className="border-t border-line mt-20">
        <div className="container py-6 text-xs text-muted">
          Prices and calories are AI-estimated. For planning, not nutritional advice.
        </div>
      </footer>
    </div>
  )
}
