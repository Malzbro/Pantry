import { createClient } from "@/utils/supabase/server"
import { PlannerApp } from "@/components/PlannerApp"
import { LandingPage } from "@/components/LandingPage"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage/>
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const first = typeof meta.first_name === "string" ? meta.first_name.trim() : ""
  const full = typeof meta.full_name === "string" ? meta.full_name.trim() : ""
  const userName = first || full

  return <PlannerApp userEmail={user.email ?? ""} userName={userName} />
}
