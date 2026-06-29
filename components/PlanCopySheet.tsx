"use client"

import { useState, useEffect } from "react"
import { Copy, ChevronRight, Loader2 } from "lucide-react"
import { listPlans, getPlan, type PlanSummary } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { Sheet } from "./Sheet"

type Props = {
  open: boolean
  onClose: () => void
  onCopy: (requestPayload: Record<string, unknown>, changeText: string) => void
}

export function PlanCopySheet({ open, onClose, onCopy }: Props) {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [changeText, setChangeText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedPlanId(null)
    setChangeText("")
    setError(null)
    setLoading(true)
    listPlans(10)
      .then(setPlans)
      .catch(() => setError("Couldn't load your plans"))
      .finally(() => setLoading(false))
  }, [open])

  const handleSelect = (id: string) => {
    setSelectedPlanId(id)
    setChangeText("")
  }

  const handleSubmit = async () => {
    if (!selectedPlanId) return
    setSubmitting(true)
    setError(null)
    try {
      const detail = await getPlan(selectedPlanId)
      onCopy(detail.request_payload as Record<string, unknown>, changeText)
    } catch {
      setError("Couldn't load that plan's details")
      setSubmitting(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  return (
    <Sheet open={open} onClose={onClose} title="Reuse a plan" contentKey="plan-copy">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : error && !plans.length ? (
        <p className="text-sm text-muted text-center py-8">{error}</p>
      ) : !plans.length ? (
        <p className="text-sm text-muted text-center py-8">No previous plans found.</p>
      ) : !selectedPlanId ? (
        <div className="space-y-2">
          <p className="text-sm text-muted mb-4">Pick a plan to reuse as a starting point.</p>
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-line hover:border-ink/40 hover:shadow-sm transition-all text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {formatDate(p.created_at)}
                </p>
                {p.total_cost_gbp != null && (
                  <p className="text-xs text-muted mt-0.5">
                    {gbp(p.total_cost_gbp)} total
                  </p>
                )}
              </div>
              <ChevronRight size={16} className="text-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedPlanId(null)}
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            &larr; Pick a different plan
          </button>

          <div className="p-3 rounded-xl border border-accent/30 bg-accent/5">
            <p className="text-sm font-medium text-ink">
              {formatDate(selectedPlan?.created_at ?? "")}
            </p>
            {selectedPlan?.total_cost_gbp != null && (
              <p className="text-xs text-muted mt-0.5">{gbp(selectedPlan.total_cost_gbp)} total</p>
            )}
          </div>

          <div>
            <label htmlFor="change-text" className="block text-sm font-medium text-ink mb-1.5">
              Any changes?
            </label>
            <textarea
              id="change-text"
              value={changeText}
              onChange={e => setChangeText(e.target.value)}
              placeholder="e.g. swap the fish night, more veggie meals, no pasta this time"
              rows={3}
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-muted mt-1">Leave blank to reuse the same preferences exactly.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-fg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Copy size={16} />
            )}
            {changeText.trim() ? "Generate with changes" : "Generate same plan"}
          </button>
        </div>
      )}
    </Sheet>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return "Unknown date"
  }
}
