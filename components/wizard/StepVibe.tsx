"use client"

import { StepShell } from "./StepShell"
import { VIBES, type WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
  progress: number
}

export function StepVibe({ state, update, onNext, onBack, progress }: Props) {
  const toggle = (id: string) => {
    if (state.selectedVibes.includes(id)) {
      update({ selectedVibes: state.selectedVibes.filter(v => v !== id) })
    } else if (state.selectedVibes.length < 3) {
      update({ selectedVibes: [...state.selectedVibes, id] })
    }
  }

  return (
    <StepShell
      progress={progress}
      title="What kind of vibe?"
      subtitle="Pick up to three — or skip and describe it later."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.selectedVibes.length > 0 ? "Continue" : "Skip"}
    >
      <div className="grid grid-cols-2 gap-4">
        {VIBES.map(vibe => {
          const isSelected = state.selectedVibes.includes(vibe.id)
          const canSelect = isSelected || state.selectedVibes.length < 3
          return (
            <button
              key={vibe.id}
              onClick={() => toggle(vibe.id)}
              disabled={!canSelect}
              className={`text-left p-5 rounded-xl border transition-all ${
                isSelected
                  ? "bg-accent text-accent-fg border-accent shadow-sm"
                  : canSelect
                  ? "bg-bg text-ink border-line hover:border-ink"
                  : "bg-bg text-muted border-line opacity-50 cursor-not-allowed"
              }`}
            >
              <p className={`font-display text-lg mb-1 ${isSelected ? "text-accent-fg" : "text-ink"}`}>
                {vibe.label}
              </p>
              <p className={`text-xs ${isSelected ? "text-accent-fg/70" : "text-muted"}`}>
                {vibe.description}
              </p>
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}
