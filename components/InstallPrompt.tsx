"use client"

import { useEffect, useState, useRef } from "react"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pantry-install-dismissed"

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShow(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") {
      setShow(false)
    }
    deferredPrompt.current = null
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISS_KEY, "1")
    deferredPrompt.current = null
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] p-4 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)]">
            Add Pantry to your home screen
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Quick access to your meal plans
          </p>
        </div>
        <button
          onClick={install}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <Download size={14} />
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
