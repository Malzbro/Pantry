"use client"

import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten_free", "dairy_free",
  "nut_free", "halal", "high_protein", "low_carb"
] as const

function formatLabel(opt: string): string {
  return opt.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
}

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
  progress: number
}

export function StepDietary({ state, update, onNext, onBack, progress }: Props) {
  const toggle = (tag: string) => {
    update({
      dietaryTags: state.dietaryTags.includes(tag)
        ? state.dietaryTags.filter(t => t !== tag)
        : [...state.dietaryTags, tag]
    })
  }

  return (
    <StepShell
      progress={progress}
      title="Any dietary needs?"
      subtitle="We'll only suggest meals that fit."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.dietaryTags.length > 0 ? "Continue" : "Skip"}
    >
      <div className="flex flex-wrap gap-3 justify-center">
        {DIETARY_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-5 py-2.5 rounded-full text-base transition-colors ${
              state.dietaryTags.includes(opt)
                ? "bg-accent text-accent-fg"
                : "bg-bg text-ink border border-line hover:border-ink"
            }`}
          >
            {formatLabel(opt)}
          </button>
        ))}
      </div>
    </StepShell>
  )
}
