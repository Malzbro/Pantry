"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { StepShell } from "./StepShell"
import { SWIPE_RECIPES, saveTasteProfile, type SwipeRecipe, type WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

type SwipeDirection = "left" | "right" | null

export function StepSwipeDeck({ state, update, onNext, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<SwipeRecipe[]>([])
  const [animating, setAnimating] = useState<SwipeDirection>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const profileSaved = useRef(false)

  const isComplete = currentIndex >= SWIPE_RECIPES.length

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    if (animating || isComplete) return
    const recipe = SWIPE_RECIPES[currentIndex]

    setAnimating(direction)

    if (direction === "right") {
      setLiked(prev => [...prev, recipe])
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setAnimating(null)
      setDragX(0)
    }, 300)
  }, [animating, currentIndex, isComplete])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (animating || isComplete) return
    setDragging(true)
    startX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [animating, isComplete])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    setDragX(e.clientX - startX.current)
  }, [dragging])

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)

    const threshold = 80
    if (dragX > threshold) {
      handleSwipe("right")
    } else if (dragX < -threshold) {
      handleSwipe("left")
    } else {
      setDragX(0)
    }
  }, [dragging, dragX, handleSwipe])

  useEffect(() => {
    if (!isComplete || profileSaved.current) return
    profileSaved.current = true

    saveTasteProfile(liked)

    const vibeVotes: Record<string, number> = {}
    for (const r of liked) {
      for (const v of r.vibeMapping) {
        vibeVotes[v] = (vibeVotes[v] || 0) + 1
      }
    }
    const topVibes = Object.entries(vibeVotes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([v]) => v)

    update({ selectedVibes: topVibes })
  }, [isComplete, liked, update])

  const rotation = dragging ? dragX * 0.08 : 0
  const opacity = dragging ? Math.max(0.5, 1 - Math.abs(dragX) / 300) : 1

  const likeIndicatorOpacity = dragX > 30 ? Math.min(1, (dragX - 30) / 70) : 0
  const skipIndicatorOpacity = dragX < -30 ? Math.min(1, (-dragX - 30) / 70) : 0

  if (isComplete) {
    return (
      <StepShell
        step={2}
        totalSteps={5}
        eyebrow="Getting to know you"
        title="Got it!"
        subtitle={`You liked ${liked.length} of ${SWIPE_RECIPES.length} recipes. We'll use this to personalise your plans.`}
        onNext={onNext}
        onBack={onBack}
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-chip px-4 py-2 rounded-full">
            <span className="text-2xl">&#10003;</span>
            <span className="text-sm text-ink">Taste profile saved</span>
          </div>

          {liked.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {liked.map(r => (
                <span
                  key={r.id}
                  className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent"
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </StepShell>
    )
  }

  const recipe = SWIPE_RECIPES[currentIndex]
  const nextRecipe = currentIndex + 1 < SWIPE_RECIPES.length ? SWIPE_RECIPES[currentIndex + 1] : null

  return (
    <StepShell
      step={2}
      totalSteps={5}
      eyebrow="Getting to know you"
      title="Would you eat this?"
      subtitle="Swipe right if you'd eat it, left to skip. This helps us learn your taste."
      onNext={onNext}
      onBack={onBack}
      nextLabel={`Skip all (${SWIPE_RECIPES.length - currentIndex} left)`}
    >
      <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
        {/* Next card (underneath) */}
        {nextRecipe && (
          <div className="absolute inset-0 rounded-xl overflow-hidden border border-line bg-chip scale-[0.96] opacity-60">
            <Image
              src={nextRecipe.imageUrl}
              alt={nextRecipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 384px) 100vw, 384px"
            />
          </div>
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          className="absolute inset-0 rounded-xl overflow-hidden border border-line shadow-lg cursor-grab active:cursor-grabbing select-none touch-none"
          style={{
            transform: animating === "right"
              ? "translateX(120%) rotate(15deg)"
              : animating === "left"
              ? "translateX(-120%) rotate(-15deg)"
              : `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: animating ? 0 : opacity,
            transition: animating || !dragging ? "transform 300ms ease-out, opacity 300ms ease-out" : "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Full-bleed image */}
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 384px) 100vw, 384px"
            priority
          />

          {/* Gradient overlay — stronger at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Swipe indicators */}
          <div
            className="absolute top-4 right-4 bg-green-500 text-white font-bold px-3 py-1 rounded-lg text-sm border-2 border-green-400 rotate-12"
            style={{ opacity: likeIndicatorOpacity, transition: dragging ? "none" : "opacity 150ms" }}
          >
            LIKE
          </div>
          <div
            className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-sm border-2 border-red-400 -rotate-12"
            style={{ opacity: skipIndicatorOpacity, transition: dragging ? "none" : "opacity 150ms" }}
          >
            SKIP
          </div>

          {/* Content overlaid at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
            <h3 className="font-display text-2xl text-white drop-shadow-md">{recipe.title}</h3>
            <p className="text-sm text-white/80 leading-snug">{recipe.description}</p>

            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <ClockIcon />
                {recipe.prepMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <PoundIcon />
                £{recipe.costPerServing.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <FlameIcon />
                {recipe.caloriesPerServing} kcal
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                {recipe.cuisine}
              </span>
              {recipe.tags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                  {t.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => handleSwipe("left")}
          disabled={!!animating}
          className="w-14 h-14 rounded-full border-2 border-line bg-bg flex items-center justify-center text-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-40"
          aria-label="Skip"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          onClick={() => handleSwipe("right")}
          disabled={!!animating}
          className="w-14 h-14 rounded-full border-2 border-line bg-bg flex items-center justify-center text-muted hover:border-green-400 hover:text-green-500 transition-colors disabled:opacity-40"
          aria-label="Like"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <p className="text-xs text-muted mt-4 text-center font-mono">
        {currentIndex + 1} of {SWIPE_RECIPES.length} &middot; {liked.length} liked
      </p>
    </StepShell>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PoundIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7 20h10M10 20c0-7 1.5-14 6-14a3 3 0 0 0-3-3c-3 0-5 3-5 7H6" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5 0 0 .5 4 3 5.5s3.5 5 1 8.5a5.5 5.5 0 0 1-9 0Z" />
    </svg>
  )
}
