"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl text-ink mb-4">Check your email</h1>
        <p className="text-muted">
          If an account exists for <strong className="text-ink">{email}</strong>,
          you&apos;ll receive a password reset link.
        </p>
        <Link href="/sign-in" className="inline-block mt-6 text-sm underline text-muted hover:text-ink">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-2xl text-ink text-center mb-8">Reset your password</h1>

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

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        <Link href="/sign-in" className="underline hover:text-ink">Back to sign in</Link>
      </p>
    </>
  )
}
