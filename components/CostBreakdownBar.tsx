"use client"

import { useEffect, useState } from "react"
import type { PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { isDark } from "@/lib/theme"

const LIGHT_SEGMENT_COLORS = [
  "#3F1521",
  "#5A1F2C",
  "#751F33",
  "#8E2E3F",
  "#A85362",
  "#C18A87",
  "#D4A89F",
]

const DARK_SEGMENT_COLORS = [
  "#7A2837",
  "#92344A",
  "#A8425B",
  "#BE5870",
  "#D17588",
  "#DF9AA8",
  "#E8B9C4",
]

function usePalette() {
  const [dark, setDark] = useState(() => isDark())
  useEffect(() => {
    const handler = () => setDark(isDark())
    window.addEventListener("pantry-theme-change", handler)
    return () => window.removeEventListener("pantry-theme-change", handler)
  }, [])
  return dark ? DARK_SEGMENT_COLORS : LIGHT_SEGMENT_COLORS
}

type Props = {
  meals: PlannedMeal[]
  budget: number
}

export function CostBreakdownBar({ meals, budget }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [animated, setAnimated] = useState(false)
  const palette = usePalette()

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const sortedMeals = [...meals].sort((a, b) => b.total_cost_gbp - a.total_cost_gbp)
  const totalSpent = meals.reduce((sum, m) => sum + m.total_cost_gbp, 0)
  const unallocated = Math.max(0, budget - totalSpent)

  return (
    <div>
      <div className="flex justify-between items-baseline gap-3 text-xs uppercase tracking-widest text-muted mb-3 min-w-0">
        <span className="flex-shrink-0">Cost breakdown</span>
        <span className="font-mono truncate text-right min-w-0">
          {hoveredIndex !== null
            ? `${sortedMeals[hoveredIndex].title} — ${gbp(sortedMeals[hoveredIndex].total_cost_gbp)}`
            : `${meals.length} meals`}
        </span>
      </div>

      <div className="h-3 bg-chip rounded-sm overflow-hidden flex">
        {sortedMeals.map((meal, i) => {
          const widthPct = animated ? (meal.total_cost_gbp / budget) * 100 : 0
          const isHovered = hoveredIndex === i
          const isDimmed = hoveredIndex !== null && hoveredIndex !== i
          return (
            <div
              key={meal.recipe_id}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="transition-all ease-out cursor-pointer"
              style={{
                width: `${widthPct}%`,
                backgroundColor: palette[i % palette.length],
                opacity: isDimmed ? 0.4 : 1,
                transitionDuration: animated ? "800ms" : "0ms",
                transitionDelay: animated ? `${i * 50}ms` : "0ms",
                transform: isHovered ? "scaleY(1.3)" : "scaleY(1)",
                transformOrigin: "center",
              }}
              title={`${meal.title} — ${gbp(meal.total_cost_gbp)}`}
            />
          )
        })}
      </div>

      <div className="flex justify-between text-xs font-mono text-muted mt-2">
        <span>£0</span>
        <span>
          {gbp(totalSpent)} of {gbp(budget)} · {unallocated > 0 ? `${gbp(unallocated)} left` : "fully allocated"}
        </span>
        <span>{gbp(budget)}</span>
      </div>
    </div>
  )
}
