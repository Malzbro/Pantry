"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export default function SignIn() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  )
}

function SignInInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo || "/")
    router.refresh()
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <>
      <h1 className="font-display text-2xl text-ink text-center mb-8">Sign in to Pantry</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-line rounded-md bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-muted mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-line rounded-md bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full py-2 border border-line rounded-md text-ink font-medium hover:bg-chip"
      >
        Continue with Google
      </button>

      <div className="mt-6 text-sm text-muted text-center space-y-1">
        <p>
          <Link href="/forgot-password" className="underline hover:text-ink">Forgot password?</Link>
        </p>
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline hover:text-ink">Sign up</Link>
        </p>
      </div>
    </>
  )
}
