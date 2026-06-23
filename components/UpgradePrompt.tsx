"use client"

import Link from "next/link"

export function UpgradePrompt({ feature }: { feature?: string }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-chip p-6 text-center max-w-sm mx-auto">
      <h3 className="font-display text-lg text-ink mb-2">
        {feature ? `${feature} is a Premium feature` : "Premium feature"}
      </h3>
      <p className="text-sm text-muted mb-4">
        Upgrade to unlock this and more — unlimited plans, pantry tracking, receipt scanning.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90"
      >
        View plans
      </Link>
    </div>
  )
}
