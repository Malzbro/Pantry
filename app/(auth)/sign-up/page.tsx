"use client"

import { useState } from "react"
import Link from "next/link"
import posthog from "posthog-js"
import { createClient } from "@/utils/supabase/client"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    posthog.capture("sign_up_submitted")
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl text-ink mb-4">Check your email</h1>
        <p className="text-muted">
          We sent a confirmation link to <strong className="text-ink">{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/sign-in" className="inline-block mt-6 text-sm underline text-muted hover:text-ink">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-2xl text-ink text-center mb-8">Create your account</h1>

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
          {loading ? "Creating account..." : "Sign up"}
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

      <p className="mt-6 text-sm text-muted text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline hover:text-ink">Sign in</Link>
      </p>

      <p className="mt-4 text-xs text-muted text-center">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
      </p>
    </>
  )
}
