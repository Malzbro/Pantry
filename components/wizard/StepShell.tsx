import "./step-shell.css"
import type { ReactNode } from "react"

type Props = {
  progress: number
  title: string
  subtitle?: string
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  canAdvance?: boolean
  nextLabel?: string
}

export function StepShell({
  progress,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  canAdvance = true,
  nextLabel = "Continue",
}: Props) {
  return (
    <div className="max-w-xl mx-auto px-6 flex flex-col min-h-[80vh] step-content">
      <div className="mb-8">
        <div className="h-[2px] bg-chip rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 p-1 text-muted hover:text-ink transition-colors"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">{title}</h1>
        {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
      </div>

      <div className="flex-1 mb-10">{children}</div>

      <div className="mt-auto pb-8">
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="w-full py-4 rounded-xl bg-accent text-accent-fg text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
