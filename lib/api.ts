import { createClient } from "@/utils/supabase/client"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }
  return headers
}

export type PlanRequest = {
  weekly_budget_gbp: number
  household_size: number
  target_calories_per_serving: number
  required_tags: string[]
  excluded_appliances: string[]
  preferred_cuisines: string[]
  preference_text: string
  meals_per_week: number
}

export type PlannedMeal = {
  recipe_id: number
  title: string
  cuisine: string
  cost_per_serving_gbp: number
  total_cost_gbp: number
  calories_per_serving: number
  relevance_score: number
}

export type PlanResponse = {
  meals: PlannedMeal[]
  total_cost_gbp: number
  budget_gbp: number
  budget_utilization: number
  avg_calories_per_serving: number
  cuisine_diversity: number
  warnings: string[]
}

export type RecipeDetail = {
  id: number
  title: string
  cuisine: string
  servings: number
  calories_per_serving: number
  prep_minutes: number
  total_cost_gbp: number
  cost_per_serving_gbp: number
  tags: string[]
  appliances: string[]
  ingredients: { name: string; grams: number; est_price_gbp: number }[]
  steps: { position: number; content: string }[]
}

export type ShoppingItem = {
  name: string
  grams: number
  estimated_cost_gbp: number
  appears_in: string[]
}

export type ShoppingCategory = {
  name: string
  items: ShoppingItem[]
}

export type ShoppingList = {
  categories: ShoppingCategory[]
  total_ingredients: number
  estimated_total_cost_gbp: number
}

export async function createPlan(req: PlanRequest): Promise<PlanResponse> {
  const r = await fetch(`${BASE_URL}/plan`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(req),
  })
  if (!r.ok) throw new Error(`Plan request failed: ${r.status}`)
  return r.json()
}

export async function getRecipe(id: number): Promise<RecipeDetail> {
  const r = await fetch(`${BASE_URL}/recipes/${id}`, {
    headers: await authHeaders(),
  })
  if (!r.ok) throw new Error(`Recipe request failed: ${r.status}`)
  return r.json()
}

export async function swapMeal(args: {
  original_recipe_id: number
  reason: string
  plan_context: PlanRequest
}): Promise<PlannedMeal> {
  const r = await fetch(`${BASE_URL}/swap`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error(`Swap failed: ${r.status}`)
  return r.json()
}

export async function getShoppingList(args: {
  recipe_ids: number[]
  household_size: number
}): Promise<ShoppingList> {
  const r = await fetch(`${BASE_URL}/shopping-list`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error(`Shopping list failed: ${r.status}`)
  return r.json()
}

export async function createCheckoutSession(tier: "monthly" | "yearly"): Promise<{ url: string }> {
  const r = await fetch(`${BASE_URL}/billing/checkout`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ tier }),
  })
  if (!r.ok) throw new Error(`Checkout failed: ${r.status}`)
  return r.json()
}

export async function createPortalSession(): Promise<{ url: string }> {
  const r = await fetch(`${BASE_URL}/billing/portal`, {
    method: "POST",
    headers: await authHeaders(),
  })
  if (!r.ok) throw new Error(`Portal session failed: ${r.status}`)
  return r.json()
}
