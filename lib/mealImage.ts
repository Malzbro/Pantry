import type { PlannedMeal } from "@/lib/api"

// The recipe dataset has no per-dish photos and only images.unsplash.com is an
// allowed image host, so we map each meal to a representative food photo. We look
// at the dish type in the title first (a "curry" looks like a curry whatever the
// cuisine), then fall back to the cuisine, then a generic plate. All IDs below are
// verified-loading Unsplash photos.
const IMG = {
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
  fallback: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=400&fit=crop",
} as const

// Dish keywords → representative image, most specific first. Each entry reuses an
// image whose subject genuinely matches the dish type.
const DISH_IMAGES: [string[], string][] = [
  [["pasta", "spaghetti", "lasagne", "lasagna", "risotto", "gnocchi", "carbonara", "ravioli"], IMG.italian],
  [["curry", "tikka", "masala", "korma", "biryani", "dal", "dhal", "saag"], IMG.indian],
  [["stir fry", "stir-fry", "fried rice", "chow mein", "sweet and sour", "szechuan", "sichuan"], IMG.chinese],
  [["taco", "burrito", "quesadilla", "fajita", "enchilada", "nachos", "con carne"], IMG.mexican],
  [["pad thai", "noodle", "ramen", "pho"], IMG.thai],
  [["sushi", "teriyaki", "katsu", "ramen"], IMG.japanese],
  [["burger", "hot dog", "mac and cheese", "buffalo", "wings"], IMG.american],
  [["kebab", "skewer", "shawarma", "falafel", "tagine", "shakshuka"], IMG.middle_eastern],
  [["bibimbap", "bulgogi", "kimchi"], IMG.korean],
  [["salad", "bowl", "buddha", "poke"], IMG.mediterranean],
  [["stew", "casserole", "hotpot", "goulash", "tagine"], IMG.african],
]

export function getMealImage(meal: Pick<PlannedMeal, "title" | "cuisine">): string {
  const title = meal.title.toLowerCase().replace(/-/g, " ")
  for (const [keywords, url] of DISH_IMAGES) {
    if (keywords.some((k) => title.includes(k))) return url
  }
  return IMG[meal.cuisine.toLowerCase() as keyof typeof IMG] ?? IMG.fallback
}
