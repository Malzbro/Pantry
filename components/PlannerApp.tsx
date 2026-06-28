"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlannerWizard } from "@/components/PlannerWizard"
import { Dashboard, VibeSelector } from "@/components/Dashboard"
import { PlanSkeleton } from "@/components/PlanSkeleton"
import { RecipeModal } from "@/components/RecipeModal"
import posthog from "posthog-js"
import { createPlan, createPortalSession, type PlanRequest, type PlanResponse, type PlannedMeal } from "@/lib/api"
import { PlanReveal } from "@/components/PlanReveal"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SubscriptionProvider, useSubscription } from "@/components/SubscriptionContext"
import { createClient } from "@/utils/supabase/client"
import { saveLastPlanRequest, loadLastPlanRequest, clearSavedPreferences } from "@/lib/vibes"

export function PlannerApp({ userEmail }: { userEmail: string }) {
  return (
    <SubscriptionProvider>
      <PlannerAppInner userEmail={userEmail} />
    </SubscriptionProvider>
  )
}

function PlannerAppInner({ userEmail }: { userEmail: string }) {
  const { isPremium } = useSubscription()
  const router = useRouter()
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
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
      setShowWizard(false)
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
    setShowWizard(true)
    setPlan(null)
    setLastRequest(null)
    setShowReveal(false)
  }

  const resetPreferences = () => {
    clearSavedPreferences()
    setSavedRequest(null)
    setPlan(null)
    setLastRequest(null)
    setShowReveal(false)
    setShowWizard(true)
  }

  const renderContent = () => {
    if (loading) return <PlanSkeleton />

    if (showWizard) {
      return <PlannerWizard onSubmit={handleSubmit} loading={loading} />
    }

    if (plan) {
      return (
        <Dashboard
          plan={plan}
          calorieTarget={lastRequest?.target_calories_per_serving ?? plan.avg_calories_per_serving}
          householdSize={lastRequest?.household_size ?? 1}
          onSelectMeal={(m: PlannedMeal) => setSelectedRecipeId(m.recipe_id)}
          onReset={() => {
            setPlan(null)
            setLastRequest(null)
            setShowReveal(false)
            setShowWizard(false)
          }}
          onRegenerate={handleRegenerate}
          lastRequest={lastRequest}
        />
      )
    }

    if (savedRequest) {
      return (
        <VibeSelector
          savedRequest={savedRequest}
          onSubmit={handleSubmit}
          onCustomise={openWizard}
          onReset={resetPreferences}
        />
      )
    }

    return <PlannerWizard onSubmit={handleSubmit} loading={loading} />
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <p className="font-display text-lg text-ink">Pantry</p>
          <div className="flex items-center gap-3">
            {plan && (
              <button
                onClick={openWizard}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                New plan
              </button>
            )}
            <span className="text-xs text-muted hidden sm:inline">{userEmail}</span>
            <ThemeToggle />
            {isPremium ? (
              <button
                onClick={async () => {
                  try {
                    const { url } = await createPortalSession()
                    window.location.href = url
                  } catch {
                    router.push("/pricing")
                  }
                }}
                className="text-xs text-muted hover:text-ink underline"
              >
                Manage subscription
              </button>
            ) : (
              <a
                href="/pricing"
                className="text-xs text-accent hover:underline font-medium"
              >
                Upgrade
              </a>
            )}
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/sign-in")
                router.refresh()
              }}
              className="text-xs text-muted hover:text-ink underline"
            >
              Sign out
            </button>
          </div>
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
