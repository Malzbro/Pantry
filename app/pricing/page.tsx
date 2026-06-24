"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import posthog from "posthog-js"
import { createClient } from "@/utils/supabase/client"
import { createCheckoutSession } from "@/lib/api"

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "",
    description: "A budget meal plan every week",
    features: [
      "1 weekly meal plan",
      "Smart budget fitting",
      "Shopping list",
    ],
    cta: null,
  },
  {
    name: "Premium",
    price: "£5.99",
    period: "/month",
    altPrice: "or £39/year (save 45%)",
    description: "Unlimited plans, pantry tracking, receipt scanning, multi-household",
    features: [
      "Unlimited meal plans",
      "Pantry tracking",
      "Receipt scanning",
      "Multi-household support",
      "Priority recipe generation",
    ],
    cta: "monthly" as const,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (tier: "monthly" | "yearly") => {
    setLoading(tier)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/sign-in?redirect=/pricing")
        return
      }

      const { url } = await createCheckoutSession(tier)
      posthog.capture("checkout_started", { tier })
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-ink">Pantry</Link>
        </div>
      </header>

      <main className="container py-12 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-3">
            Simple pricing
          </h1>
          <p className="text-muted max-w-md mx-auto">
            Start free. Upgrade when you need more.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 border border-accent rounded-md text-accent text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-6 ${
                plan.cta
                  ? "border-accent bg-bg shadow-sm"
                  : "border-line bg-bg"
              }`}
            >
              <h2 className="font-display text-xl text-ink mb-1">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-semibold text-ink">{plan.price}</span>
                {plan.period && <span className="text-muted text-sm">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-ink flex items-start gap-2">
                    <span className="text-accent mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.cta ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleSubscribe("monthly")}
                    disabled={loading !== null}
                    className="w-full py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {loading === "monthly" ? "Redirecting..." : "Subscribe monthly — £5.99"}
                  </button>
                  <button
                    onClick={() => handleSubscribe("yearly")}
                    disabled={loading !== null}
                    className="w-full py-2 border border-accent text-accent rounded-md font-medium hover:bg-chip disabled:opacity-50"
                  >
                    {loading === "yearly" ? "Redirecting..." : "Subscribe yearly — £39"}
                  </button>
                  <p className="text-xs text-muted text-center">Save 45% with yearly</p>
                </div>
              ) : (
                <Link
                  href="/"
                  className="block w-full py-2 border border-line rounded-md font-medium text-center text-ink hover:bg-chip"
                >
                  Current plan
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted text-center">
          <Link href="/terms" className="underline hover:text-ink">Terms</Link>
          {" · "}
          <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>
        </p>
      </main>
    </div>
  )
}
