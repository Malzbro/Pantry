export type Vibe = {
  id: string
  label: string
  description: string
  preferenceText: string
  dietaryTags: string[]
  cuisineBias: string[]
}

export const VIBES: Vibe[] = [
  {
    id: "quick",
    label: "Quick & Easy",
    description: "Weeknight-friendly, under 30 minutes",
    preferenceText: "quick weeknight meals under 30 minutes, simple ingredients",
    dietaryTags: [],
    cuisineBias: [],
  },
  {
    id: "comfort",
    label: "Healthy Comfort",
    description: "Wholesome but still cosy",
    preferenceText: "wholesome comforting meals with vegetables",
    dietaryTags: [],
    cuisineBias: [],
  },
  {
    id: "fakeaway",
    label: "Fakeaway",
    description: "Takeaway energy, home prices",
    preferenceText: "takeaway-style indulgent comfort food",
    dietaryTags: [],
    cuisineBias: ["chinese", "indian", "mexican", "american"],
  },
  {
    id: "family",
    label: "Family Friendly",
    description: "Crowd-pleasers, easy to scale",
    preferenceText: "hearty family-friendly dinners that please everyone",
    dietaryTags: [],
    cuisineBias: ["british", "italian"],
  },
  {
    id: "protein",
    label: "High Protein",
    description: "Filling, protein-rich meals",
    preferenceText: "protein-rich meals with meat or legumes",
    dietaryTags: ["high_protein"],
    cuisineBias: [],
  },
  {
    id: "plant",
    label: "Plant-Forward",
    description: "Vegetable-heavy, mostly meat-free",
    preferenceText: "vegetable-heavy plant-based meals",
    dietaryTags: ["vegetarian"],
    cuisineBias: ["mediterranean", "indian", "middle_eastern"],
  },
  {
    id: "world",
    label: "World Food",
    description: "International variety, bold flavours",
    preferenceText: "varied international dishes with bold flavours",
    dietaryTags: [],
    cuisineBias: ["indian", "thai", "japanese", "mexican", "african"],
  },
  {
    id: "budget",
    label: "Budget Stretch",
    description: "Maximum filling, minimum spend",
    preferenceText: "the most affordable filling meals, budget-conscious",
    dietaryTags: [],
    cuisineBias: [],
  },
]


export type WizardState = {
  step: number
  budget: number
  household: number
  calories: number
  selectedVibes: string[]
  dietaryTags: string[]
  excludedAppliances: string[]
  preferenceText: string
}


import type { PlanRequest } from "@/lib/api"

export function buildPlanRequest(state: WizardState): PlanRequest {
  const selected = VIBES.filter(v => state.selectedVibes.includes(v.id))
  const vibePrefText = selected.map(v => v.preferenceText).join(". ")
  const vibeTags = selected.flatMap(v => v.dietaryTags)
  const vibeCuisines = selected.flatMap(v => v.cuisineBias)

  const profile = loadTasteProfile()
  const profilePrefText = profile?.preferenceText || ""
  const profileCuisines = profile?.likedCuisines || []
  const profileTags = profile?.likedTags || []

  const combinedPrefText = [profilePrefText, state.preferenceText, vibePrefText]
    .filter(Boolean)
    .join(". ")

  const combinedTags = Array.from(new Set([...state.dietaryTags, ...vibeTags, ...profileTags]))

  const combinedCuisines = Array.from(new Set([...vibeCuisines, ...profileCuisines]))

  return {
    weekly_budget_gbp: state.budget,
    household_size: state.household,
    target_calories_per_serving: state.calories,
    required_tags: combinedTags,
    excluded_appliances: state.excludedAppliances,
    preferred_cuisines: combinedCuisines,
    preference_text: combinedPrefText,
    preference_vector: profile?.preferenceVector || null,
    meals_per_week: 7,
  }
}


export const INITIAL_STATE: WizardState = {
  step: 1,
  budget: 25,
  household: 2,
  calories: 600,
  selectedVibes: [],
  dietaryTags: [],
  excludedAppliances: [],
  preferenceText: "",
}

export const TOTAL_STEPS = 5

const LAST_REQUEST_KEY = "pantry_last_plan_request"

export function saveLastPlanRequest(req: PlanRequest): void {
  try {
    localStorage.setItem(LAST_REQUEST_KEY, JSON.stringify(req))
  } catch {}
}

export function loadLastPlanRequest(): PlanRequest | null {
  try {
    const raw = localStorage.getItem(LAST_REQUEST_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlanRequest
  } catch {
    return null
  }
}

export function clearSavedPreferences(): void {
  try {
    localStorage.removeItem(LAST_REQUEST_KEY)
    localStorage.removeItem(TASTE_PROFILE_KEY)
  } catch {}
}


// ── Preference vector ─────────────────────────────────────────────────

export type PreferenceVector = {
  spice: number       // 0 = mild, 5 = very spicy
  sauce: number       // 0 = dry, 5 = very saucy
  richness: number    // 0 = light, 5 = rich / indulgent
  effort: number      // 0 = minimal / no-cook, 5 = involved project
  familiarity: number // 0 = adventurous / exotic, 5 = familiar comfort
}

export const PREFERENCE_AXES = ["spice", "sauce", "richness", "effort", "familiarity"] as const

export function computePreferenceVector(liked: SwipeRecipe[]): PreferenceVector {
  if (liked.length === 0) {
    return { spice: 2.5, sauce: 2.5, richness: 2.5, effort: 2.5, familiarity: 2.5 }
  }
  const sum = { spice: 0, sauce: 0, richness: 0, effort: 0, familiarity: 0 }
  for (const r of liked) {
    for (const axis of PREFERENCE_AXES) {
      sum[axis] += r.vector[axis]
    }
  }
  const n = liked.length
  return {
    spice: Math.round((sum.spice / n) * 10) / 10,
    sauce: Math.round((sum.sauce / n) * 10) / 10,
    richness: Math.round((sum.richness / n) * 10) / 10,
    effort: Math.round((sum.effort / n) * 10) / 10,
    familiarity: Math.round((sum.familiarity / n) * 10) / 10,
  }
}

export function preferenceVectorToText(v: PreferenceVector): string {
  const parts: string[] = []
  if (v.spice >= 3.5) parts.push("enjoys spicy food")
  else if (v.spice <= 1.5) parts.push("prefers mild food")
  if (v.sauce >= 3.5) parts.push("likes saucy dishes")
  else if (v.sauce <= 1.5) parts.push("prefers drier dishes")
  if (v.richness >= 3.5) parts.push("likes rich, indulgent meals")
  else if (v.richness <= 1.5) parts.push("prefers light, healthy meals")
  if (v.effort <= 1.5) parts.push("prefers quick, easy recipes")
  else if (v.effort >= 3.5) parts.push("happy with involved cooking")
  if (v.familiarity >= 3.5) parts.push("prefers familiar comfort food")
  else if (v.familiarity <= 1.5) parts.push("enjoys trying adventurous dishes")
  return parts.join("; ")
}

// ── Swipe deck onboarding ──────────────────────────────────────────────

export type SwipeRecipe = {
  id: string
  title: string
  description: string
  cuisine: string
  tags: string[]
  prepMinutes: number
  costPerServing: number
  caloriesPerServing: number
  imageUrl: string
  vibeMapping: string[]
  vector: PreferenceVector
}

export const SWIPE_RECIPES: SwipeRecipe[] = [
  {
    id: "sw-cottage-pie",
    title: "Classic Cottage Pie",
    description: "Hearty beef mince topped with creamy mash, baked golden.",
    cuisine: "british",
    tags: ["high_protein"],
    prepMinutes: 30,
    costPerServing: 1.20,
    caloriesPerServing: 550,
    imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop",
    vibeMapping: ["comfort", "family"],
    vector: { spice: 0, sauce: 3, richness: 4, effort: 3, familiarity: 5 },
  },
  {
    id: "sw-chicken-tikka",
    title: "Chicken Tikka Masala",
    description: "Spiced chicken in a rich, creamy tomato sauce with rice.",
    cuisine: "indian",
    tags: ["high_protein", "gluten_free"],
    prepMinutes: 25,
    costPerServing: 1.50,
    caloriesPerServing: 620,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    vibeMapping: ["fakeaway", "world"],
    vector: { spice: 3, sauce: 5, richness: 4, effort: 3, familiarity: 4 },
  },
  {
    id: "sw-stir-fry",
    title: "Veggie Stir Fry",
    description: "Crunchy vegetables in a sweet soy glaze, ready in 15 minutes.",
    cuisine: "chinese",
    tags: ["vegetarian", "dairy_free"],
    prepMinutes: 15,
    costPerServing: 0.80,
    caloriesPerServing: 320,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
    vibeMapping: ["quick", "plant", "budget"],
    vector: { spice: 1, sauce: 2, richness: 1, effort: 1, familiarity: 4 },
  },
  {
    id: "sw-tacos",
    title: "Beef Tacos",
    description: "Spiced beef with fresh salsa, cheese, and crunchy shells.",
    cuisine: "mexican",
    tags: [],
    prepMinutes: 20,
    costPerServing: 1.30,
    caloriesPerServing: 480,
    imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
    vibeMapping: ["fakeaway", "quick", "family"],
    vector: { spice: 2, sauce: 2, richness: 3, effort: 2, familiarity: 4 },
  },
  {
    id: "sw-pad-thai",
    title: "Prawn Pad Thai",
    description: "Rice noodles with prawns, peanuts, and a tangy tamarind sauce.",
    cuisine: "thai",
    tags: ["dairy_free"],
    prepMinutes: 20,
    costPerServing: 1.80,
    caloriesPerServing: 520,
    imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop",
    vibeMapping: ["world", "quick"],
    vector: { spice: 2, sauce: 3, richness: 2, effort: 2, familiarity: 3 },
  },
  {
    id: "sw-teriyaki-salmon",
    title: "Teriyaki Salmon Bowl",
    description: "Glazed salmon on sticky rice with pickled veg and sesame.",
    cuisine: "japanese",
    tags: ["high_protein", "dairy_free"],
    prepMinutes: 25,
    costPerServing: 2.50,
    caloriesPerServing: 580,
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    vibeMapping: ["protein", "world"],
    vector: { spice: 0, sauce: 3, richness: 3, effort: 3, familiarity: 3 },
  },
  {
    id: "sw-pasta-arrabbiata",
    title: "Pasta Arrabbiata",
    description: "Penne in a fiery tomato and chilli sauce with fresh basil.",
    cuisine: "italian",
    tags: ["vegetarian", "dairy_free"],
    prepMinutes: 15,
    costPerServing: 0.60,
    caloriesPerServing: 420,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    vibeMapping: ["quick", "budget", "plant"],
    vector: { spice: 3, sauce: 4, richness: 2, effort: 1, familiarity: 4 },
  },
  {
    id: "sw-greek-salad-bowl",
    title: "Greek Grain Bowl",
    description: "Feta, olives, cucumber and chickpeas over herby couscous.",
    cuisine: "mediterranean",
    tags: ["vegetarian"],
    prepMinutes: 10,
    costPerServing: 1.00,
    caloriesPerServing: 380,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    vibeMapping: ["plant", "quick", "budget"],
    vector: { spice: 0, sauce: 1, richness: 2, effort: 1, familiarity: 3 },
  },
  {
    id: "sw-jollof-rice",
    title: "Jollof Rice with Chicken",
    description: "One-pot spiced tomato rice with tender chicken thighs.",
    cuisine: "african",
    tags: ["gluten_free", "dairy_free"],
    prepMinutes: 35,
    costPerServing: 1.40,
    caloriesPerServing: 600,
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    vibeMapping: ["world", "family", "comfort"],
    vector: { spice: 3, sauce: 3, richness: 3, effort: 3, familiarity: 2 },
  },
  {
    id: "sw-falafel-wrap",
    title: "Falafel Wrap",
    description: "Crispy chickpea falafel with hummus, salad, and tahini drizzle.",
    cuisine: "middle_eastern",
    tags: ["vegetarian", "dairy_free"],
    prepMinutes: 25,
    costPerServing: 0.90,
    caloriesPerServing: 450,
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop",
    vibeMapping: ["plant", "budget", "world"],
    vector: { spice: 1, sauce: 2, richness: 2, effort: 2, familiarity: 3 },
  },
  {
    id: "sw-bbq-burger",
    title: "Smashed BBQ Burger",
    description: "Double-stacked beef patties with smoky sauce and pickles.",
    cuisine: "american",
    tags: ["high_protein"],
    prepMinutes: 20,
    costPerServing: 1.60,
    caloriesPerServing: 700,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    vibeMapping: ["fakeaway", "protein", "comfort"],
    vector: { spice: 1, sauce: 3, richness: 5, effort: 2, familiarity: 5 },
  },
  {
    id: "sw-dhal",
    title: "Red Lentil Dhal",
    description: "Creamy spiced lentils with garlic naan — pure comfort.",
    cuisine: "indian",
    tags: ["vegan", "gluten_free"],
    prepMinutes: 25,
    costPerServing: 0.50,
    caloriesPerServing: 380,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    vibeMapping: ["budget", "plant", "comfort"],
    vector: { spice: 3, sauce: 5, richness: 3, effort: 2, familiarity: 3 },
  },
  {
    id: "sw-chicken-fajitas",
    title: "Sizzling Chicken Fajitas",
    description: "Spiced chicken strips with peppers, guac, and warm tortillas.",
    cuisine: "mexican",
    tags: ["high_protein"],
    prepMinutes: 20,
    costPerServing: 1.40,
    caloriesPerServing: 520,
    imageUrl: "https://images.unsplash.com/photo-1611250188496-e966043a0629?w=400&h=300&fit=crop",
    vibeMapping: ["quick", "protein", "family"],
    vector: { spice: 3, sauce: 2, richness: 2, effort: 2, familiarity: 5 },
  },
  {
    id: "sw-risotto",
    title: "Mushroom Risotto",
    description: "Slow-stirred creamy arborio rice with mixed wild mushrooms.",
    cuisine: "italian",
    tags: ["vegetarian"],
    prepMinutes: 30,
    costPerServing: 1.10,
    caloriesPerServing: 480,
    imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
    vibeMapping: ["comfort", "plant"],
    vector: { spice: 0, sauce: 3, richness: 4, effort: 4, familiarity: 4 },
  },
  {
    id: "sw-fish-chips",
    title: "Oven-Baked Fish & Chips",
    description: "Crispy battered cod with chunky chips — the British classic.",
    cuisine: "british",
    tags: [],
    prepMinutes: 30,
    costPerServing: 1.70,
    caloriesPerServing: 580,
    imageUrl: "https://images.unsplash.com/photo-1579208030886-b1f5b7b4deb2?w=400&h=300&fit=crop",
    vibeMapping: ["fakeaway", "family", "comfort"],
    vector: { spice: 0, sauce: 1, richness: 3, effort: 3, familiarity: 5 },
  },
]

export type TasteProfile = {
  likedCuisines: string[]
  likedTags: string[]
  preferenceText: string
  preferenceVector: PreferenceVector
  completedAt: string
}

const TASTE_PROFILE_KEY = "pantry_taste_profile"

export function saveTasteProfile(likedRecipes: SwipeRecipe[]): TasteProfile {
  const cuisineCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}
  for (const r of likedRecipes) {
    cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1
    for (const t of r.tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }

  const likedCuisines = Object.entries(cuisineCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)

  const likedTags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)

  const descriptions = likedRecipes.map(r => r.title).join(", ")
  const preferenceVector = computePreferenceVector(likedRecipes)
  const vectorText = preferenceVectorToText(preferenceVector)
  const preferenceText = `User liked these during onboarding: ${descriptions}. Preferred cuisines: ${likedCuisines.join(", ") || "varied"}.${vectorText ? ` Taste profile: ${vectorText}.` : ""}`

  const profile: TasteProfile = {
    likedCuisines,
    likedTags,
    preferenceText,
    preferenceVector,
    completedAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(profile))
  } catch {}

  return profile
}

export function loadTasteProfile(): TasteProfile | null {
  try {
    const raw = localStorage.getItem(TASTE_PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TasteProfile
  } catch {
    return null
  }
}
