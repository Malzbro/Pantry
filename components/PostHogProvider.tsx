"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

const CONSENT_KEY = "pantry_cookie_consent"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      opt_out_capturing_by_default: true,
    })

    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === "all") {
      posthog.opt_in_capturing()
    }
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== CONSENT_KEY) return
      if (e.newValue === "all") {
        posthog.opt_in_capturing()
      } else {
        posthog.opt_out_capturing()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
