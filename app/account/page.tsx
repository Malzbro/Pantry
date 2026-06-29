import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AccountDetails } from "@/components/AccountDetails"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const firstName = typeof meta.first_name === "string" ? meta.first_name : ""
  const lastName = typeof meta.last_name === "string" ? meta.last_name : ""

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg text-ink hover:text-accent transition-colors"
          >
            Pantry
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-ink underline">
            Back
          </Link>
        </div>
      </header>

      <main className="container py-12 sm:py-16">
        <AccountDetails
          email={user.email ?? ""}
          createdAt={user.created_at}
          initialFirstName={firstName}
          initialLastName={lastName}
        />
      </main>
    </div>
  )
}
