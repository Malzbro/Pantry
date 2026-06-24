"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const CONSENT_KEY = "pantry_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept(value: "all" | "essential") {
    localStorage.setItem(CONSENT_KEY, value)
    window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY, newValue: value }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-bg shadow-lg p-4 sm:p-5">
        <p className="text-sm text-muted leading-relaxed mb-4">
          We use essential cookies to keep you signed in. Non-essential cookies
          help us understand how Pantry is used.{" "}
          <Link href="/privacy" className="underline hover:text-ink">
            Privacy policy
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => accept("essential")}
            className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-ink hover:border-card-border-hover transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => accept("all")}
            className="rounded-md bg-accent text-accent-fg px-4 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
