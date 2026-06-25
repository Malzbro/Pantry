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
  },
]

export type TasteProfile = {
  likedCuisines: string[]
  likedTags: string[]
  preferenceText: string
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
  const preferenceText = `User liked these during onboarding: ${descriptions}. Preferred cuisines: ${likedCuisines.join(", ") || "varied"}.`

  const profile: TasteProfile = {
    likedCuisines,
    likedTags,
    preferenceText,
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
