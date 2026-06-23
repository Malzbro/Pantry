"use client"

import { useCallback, useEffect, useState } from "react"
import { subscribePush, unsubscribePush } from "@/lib/api"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

type PushState = "unsupported" | "prompt" | "subscribed" | "denied" | "loading"

export function usePushSubscription() {
  const [state, setState] = useState<PushState>("loading")

  const refresh = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setState("unsupported")
      return
    }

    const permission = Notification.permission
    if (permission === "denied") {
      setState("denied")
      return
    }

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setState(sub ? "subscribed" : "prompt")
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const subscribe = useCallback(async () => {
    setState("loading")
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })
      await subscribePush(sub)
      setState("subscribed")
    } catch {
      await refresh()
    }
  }, [refresh])

  const unsubscribe = useCallback(async () => {
    setState("loading")
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await unsubscribePush(sub.endpoint)
        await sub.unsubscribe()
      }
      setState("prompt")
    } catch {
      await refresh()
    }
  }, [refresh])

  return { state, subscribe, unsubscribe }
}
