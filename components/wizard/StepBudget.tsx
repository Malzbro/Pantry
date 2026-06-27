"use client"

import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  progress: number
}

export function StepBudget({ state, update, onNext, progress }: Props) {
  return (
    <StepShell
      progress={progress}
      title="What's your budget?"
      subtitle="We'll keep the whole week under this number."
      onNext={onNext}
      canAdvance={state.budget >= 10 && state.household >= 1}
    >
      <div className="space-y-14">
        <div className="text-center">
          <p className="font-display text-7xl md:text-8xl text-ink">
            £{state.budget}
          </p>
          <p className="text-muted text-sm mt-2">per week</p>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={state.budget}
            onChange={e => update({ budget: Number(e.target.value) })}
            className="w-full mt-6 wizard-slider"
            aria-label={`Weekly budget: £${state.budget}`}
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>£10</span>
            <span>£200</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl text-ink mb-5">How many people?</h2>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => update({ household: n })}
                className={`w-14 h-14 rounded-full text-lg font-medium transition-colors ${
                  state.household === n
                    ? "bg-accent text-accent-fg"
                    : "bg-bg text-ink border border-line hover:border-ink"
                }`}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  )
}
