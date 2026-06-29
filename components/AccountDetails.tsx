"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

type Props = {
  email: string
  createdAt?: string
  initialFirstName: string
  initialLastName: string
}

export function AccountDetails({ email, createdAt, initialFirstName, initialLastName }: Props) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const dirty =
    firstName.trim() !== initialFirstName.trim() ||
    lastName.trim() !== initialLastName.trim()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatus("idle")
    setErrorMsg(null)

    const first = firstName.trim()
    const last = lastName.trim()
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: first,
        last_name: last,
        full_name: `${first} ${last}`.trim(),
      },
    })

    if (error) {
      setStatus("error")
      setErrorMsg(error.message)
    } else {
      setStatus("saved")
    }
    setSaving(false)
  }

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Account</h1>
      <p className="text-muted mb-8">Manage your profile details.</p>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm text-muted mb-1">First name</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm text-muted mb-1">Last name</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">Email</label>
          <div className="w-full px-3 py-2 border border-line rounded-md bg-chip text-ink">
            {email}
          </div>
        </div>

        {memberSince && (
          <div>
            <label className="block text-sm text-muted mb-1">Member since</label>
            <div className="w-full px-3 py-2 border border-line rounded-md bg-chip text-ink">
              {memberSince}
            </div>
          </div>
        )}

        {status === "saved" && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-accent">{errorMsg ?? "Could not save. Try again."}</p>
        )}

        <button
          type="submit"
          disabled={saving || !dirty}
          className="px-5 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  )
}
