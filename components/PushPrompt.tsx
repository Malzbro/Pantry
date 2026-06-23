"use client"

import { useState } from "react"
import { Bell, X } from "lucide-react"
import { usePushSubscription } from "@/lib/usePushSubscription"

const DISMISS_KEY = "pantry-push-dismissed"

export function PushPrompt() {
  const { state, subscribe } = usePushSubscription()
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1"
  )

  if (dismissed || state !== "prompt") return null

  // On iOS, push only works in standalone (home-screen) mode
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true)

  // Don't prompt users who are in a regular browser tab on iOS — they can't subscribe anyway
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS && !isStandalone) return null

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, "1")
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] p-4 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)]">
            Get weekly meal plan reminders
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            We&apos;ll nudge you when it&apos;s time to plan
          </p>
        </div>
        <button
          onClick={subscribe}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <Bell size={14} />
          Enable
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss notification prompt"
          className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
