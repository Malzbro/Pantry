"use client"

import { useState, useEffect } from "react"
import { INITIAL_STATE, TOTAL_STEPS, buildPlanRequest, loadTasteProfile, type WizardState } from "@/lib/vibes"
import type { PlanRequest } from "@/lib/api"
import { StepBudget } from "./wizard/StepBudget"
import { StepVibe } from "./wizard/StepVibe"
import { StepSwipeDeck } from "./wizard/StepSwipeDeck"
import { StepDietary } from "./wizard/StepDietary"
import { StepAppliances } from "./wizard/StepAppliances"
import { StepFreeform } from "./wizard/StepFreeform"

const TRANSITION_MS = 250

type Props = {
  onSubmit: (req: PlanRequest) => void
  loading: boolean
}

export function PlannerWizard({ onSubmit, loading }: Props) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [exiting, setExiting] = useState<"forward" | "back" | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    setHasProfile(loadTasteProfile() !== null)
  }, [])

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))

  const transitionTo = (direction: "forward" | "back", newStep: number) => {
    setExiting(direction)
    setTimeout(() => {
      setState(s => ({ ...s, step: newStep }))
      setExiting(null)
    }, TRANSITION_MS)
  }

  const next = () => transitionTo("forward", Math.min(state.step + 1, TOTAL_STEPS))
  const back = () => transitionTo("back", Math.max(state.step - 1, 1))
  const submit = () => onSubmit(buildPlanRequest(state))

  if (hasProfile === null) return null

  return (
    <div key={state.step} data-exiting={exiting ?? ""}>
      {state.step === 1 && <StepBudget state={state} update={update} onNext={next} />}
      {state.step === 2 && (
        hasProfile
          ? <StepVibe state={state} update={update} onNext={next} onBack={back} />
          : <StepSwipeDeck state={state} update={update} onNext={next} onBack={back} />
      )}
      {state.step === 3 && <StepDietary state={state} update={update} onNext={next} onBack={back} />}
      {state.step === 4 && <StepAppliances state={state} update={update} onNext={next} onBack={back} />}
      {state.step === 5 && <StepFreeform state={state} update={update} onNext={submit} onBack={back} loading={loading} />}
    </div>
  )
}
