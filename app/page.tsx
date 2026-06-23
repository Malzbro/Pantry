import { createClient } from "@/utils/supabase/server"
import { PlannerApp } from "@/components/PlannerApp"
import { LandingPage } from "@/components/LandingPage"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  return <PlannerApp userEmail={user.email ?? ""} />
}
