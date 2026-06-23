"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getEntitlement, type Entitlement } from "@/lib/api"

type SubscriptionState = {
  tier: string | null
  isPremium: boolean
  cancelAtPeriodEnd: boolean
  loading: boolean
}

const SubscriptionContext = createContext<SubscriptionState>({
  tier: null,
  isPremium: false,
  cancelAtPeriodEnd: false,
  loading: true,
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    tier: null,
    isPremium: false,
    cancelAtPeriodEnd: false,
    loading: true,
  })

  useEffect(() => {
    getEntitlement()
      .then((e: Entitlement) => {
        setState({
          tier: e.tier,
          isPremium: e.is_premium,
          cancelAtPeriodEnd: e.cancel_at_period_end,
          loading: false,
        })
      })
      .catch(() => {
        setState((prev) => ({ ...prev, loading: false }))
      })
  }, [])

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
