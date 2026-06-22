import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { PlannerApp } from "@/components/PlannerApp"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return <PlannerApp userEmail={user.email ?? ""} />
}
