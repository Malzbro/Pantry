"use client"

import { useState, useEffect } from "react"
import { INITIAL_STATE, buildPlanRequest, loadTasteProfile, loadLastPlanRequest, type WizardState } from "@/lib/vibes"
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
  const [hasPreviousPlan, setHasPreviousPlan] = useState(false)

  useEffect(() => {
    setHasProfile(loadTasteProfile() !== null)
    const prev = loadLastPlanRequest()
    if (prev) {
      setHasPreviousPlan(true)
      setState(s => ({
        ...s,
        budget: prev.weekly_budget_gbp,
        household: prev.household_size,
        calories: prev.target_calories_per_serving,
        excludedAppliances: prev.excluded_appliances,
        dietaryTags: prev.required_tags,
      }))
    }
  }, [])

  const skipAppliances = hasPreviousPlan
  const totalSteps = skipAppliances ? 4 : 5

  const stepOrder = skipAppliances
    ? ["budget", "vibe", "dietary", "freeform"] as const
    : ["budget", "vibe", "dietary", "appliances", "freeform"] as const

  const currentStep = stepOrder[state.step - 1]
  const progress = state.step / totalSteps

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))

  const transitionTo = (direction: "forward" | "back", newStep: number) => {
    setExiting(direction)
    setTimeout(() => {
      setState(s => ({ ...s, step: newStep }))
      setExiting(null)
    }, TRANSITION_MS)
  }

  const next = () => transitionTo("forward", Math.min(state.step + 1, totalSteps))
  const back = () => transitionTo("back", Math.max(state.step - 1, 1))
  const submit = () => onSubmit(buildPlanRequest(state))

  if (hasProfile === null) return null

  return (
    <div key={state.step} data-exiting={exiting ?? ""}>
      {currentStep === "budget" && <StepBudget state={state} update={update} onNext={next} progress={progress} />}
      {currentStep === "vibe" && (
        hasProfile
          ? <StepVibe state={state} update={update} onNext={next} onBack={back} progress={progress} />
          : <StepSwipeDeck state={state} update={update} onNext={next} onBack={back} progress={progress} />
      )}
      {currentStep === "dietary" && <StepDietary state={state} update={update} onNext={next} onBack={back} progress={progress} />}
      {currentStep === "appliances" && <StepAppliances state={state} update={update} onNext={next} onBack={back} progress={progress} />}
      {currentStep === "freeform" && <StepFreeform state={state} update={update} onNext={submit} onBack={back} loading={loading} progress={progress} />}
    </div>
  )
}
