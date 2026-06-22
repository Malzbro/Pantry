"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

import microwaveImg from "@/public/appliances/microwave.png"
import ovenImg from "@/public/appliances/oven.png"
import airFryerImg from "@/public/appliances/air_fryer.png"
import grillImg from "@/public/appliances/grill.png"
import slowCookerImg from "@/public/appliances/slow_cooker.png"
import blenderImg from "@/public/appliances/blender.png"
import kitchenBgImg from "@/public/appliances/kitchen-bg.png"

const applianceImages: Record<string, typeof microwaveImg> = {
  microwave: microwaveImg,
  oven: ovenImg,
  air_fryer: airFryerImg,
  grill: grillImg,
  slow_cooker: slowCookerImg,
  blender: blenderImg,
}

type Appliance = {
  id: string
  label: string
  x: number
  y: number
  size: number
}

const APPLIANCES: Appliance[] = [
  { id: "oven",        label: "Oven",        x: 60, y: 64, size: 4 },
  { id: "microwave",   label: "Microwave",   x: 81, y: 50, size: 4 },
  { id: "air_fryer",   label: "Air fryer",   x: 55, y: 47, size: 2 },
  { id: "blender",     label: "Blender",     x: 20, y: 44, size: 4 },
  { id: "slow_cooker", label: "Slow cooker", x: 45, y: 47, size: 3 },
  { id: "grill",       label: "Grill",       x: 65, y: 45, size: 4 },
]

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepAppliances({ state, update, onNext, onBack }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  const initRef = useRef(false)
  useEffect(() => {
    if (!initRef.current && state.excludedAppliances.length === 0) {
      update({ excludedAppliances: APPLIANCES.map(a => a.id) })
    }
    initRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOwned = (id: string) => !state.excludedAppliances.includes(id)

  const toggle = (id: string) => {
    update({
      excludedAppliances: state.excludedAppliances.includes(id)
        ? state.excludedAppliances.filter(a => a !== id)
        : [...state.excludedAppliances, id],
    })
  }

  const hasImage = (id: string) => id in applianceImages && !imgErrors.has(id)
  const onImgError = (id: string) =>
    setImgErrors(prev => new Set(prev).add(id))

  return (
    <StepShell
      step={4}
      totalSteps={5}
      eyebrow="Your kitchen"
      title="What's on your counter?"
      subtitle="Tap the appliances you have. We'll plan around them."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.excludedAppliances.length > 0 ? "Continue" : "Skip"}
    >
      <div
        className="relative w-full mx-auto overflow-hidden rounded-xl border border-line"
        style={{
          maxWidth: 800,
          aspectRatio: "16 / 9",
        }}
      >
        <Image
          src={kitchenBgImg}
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(250, 250, 248, 0.15)" }}
        />

        {APPLIANCES.map(app => {
          const owned = isOwned(app.id)
          const hovered = hoveredId === app.id
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => toggle(app.id)}
              onMouseEnter={() => setHoveredId(app.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="absolute focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
              style={{
                left: `${app.x}%`,
                top: `${app.y}%`,
                width: `clamp(44px, ${app.size * 1.4}vw, 90px)`,
                transform: `translateY(${hovered ? -4 : 0}px)`,
                transition:
                  "transform 200ms ease, opacity 200ms ease, filter 200ms ease",
                opacity: owned ? 1 : 0.45,
                filter: owned
                  ? "drop-shadow(0 0 10px rgba(107,39,55,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                  : hovered
                    ? "drop-shadow(0 4px 8px rgba(0,0,0,0.18)) grayscale(0.4)"
                    : "grayscale(0.6) brightness(0.95)",
                zIndex: hovered ? 10 : 1,
              }}
              aria-label={`${app.label} — ${owned ? "selected" : "not selected"}`}
              aria-pressed={owned}
            >
              {owned && (
                <div
                  className="absolute -inset-2 rounded-xl pointer-events-none"
                  style={{
                    border: "2px solid #6B2737",
                    boxShadow: "0 0 12px rgba(107,39,55,0.3)",
                  }}
                />
              )}

              {hasImage(app.id) ? (
                <Image
                  src={applianceImages[app.id]}
                  alt={app.label}
                  onError={() => onImgError(app.id)}
                  draggable={false}
                  width={90}
                  height={76}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              ) : (
                <div
                  className="rounded-lg border-2 border-dashed border-current flex items-center justify-center text-center px-1"
                  style={{ width: "100%", aspectRatio: "1 / 0.85" }}
                >
                  <span className="text-[11px] font-mono leading-tight opacity-70">
                    {app.label}
                  </span>
                </div>
              )}

              <span
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none text-xs font-medium px-2 py-1 rounded bg-ink text-bg"
                style={{
                  bottom: "calc(100% + 8px)",
                  opacity: hovered ? 1 : 0,
                  transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)`,
                  transition: "opacity 150ms ease, transform 150ms ease",
                }}
              >
                {app.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted mt-4">
        Tap an appliance to add it to your kitchen. Tap again to remove.
      </p>
    </StepShell>
  )
}
