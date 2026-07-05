const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export type MealDay = { label: string; isToday: boolean }

/**
 * Map plan meals to calendar days anchored on the plan's creation date.
 * Meal 0 is the day the plan was created; each subsequent meal is the next day.
 * This avoids the old assumption that meal 0 = Monday and the plan has 7 meals,
 * which mislabelled short or mid-week-generated plans and highlighted the wrong day.
 */
export function getMealDays(startISO: string | null, count: number): MealDay[] {
  const start = startISO ? new Date(startISO) : null
  const valid = start !== null && !isNaN(start.getTime())
  const today = new Date().toDateString()

  const days: MealDay[] = []
  for (let i = 0; i < count; i++) {
    if (valid) {
      const d = new Date(start as Date)
      d.setDate(d.getDate() + i)
      days.push({ label: WEEKDAY_SHORT[d.getDay()], isToday: d.toDateString() === today })
    } else {
      days.push({ label: `Day ${i + 1}`, isToday: false })
    }
  }
  return days
}
