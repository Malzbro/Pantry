"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Home, Sparkles, Sun, Moon, CreditCard, LogOut, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { createPortalSession } from "@/lib/api"
import { getInitialTheme, applyTheme, type Theme } from "@/lib/theme"

type HeaderMenuProps = {
  userEmail: string
  isPremium: boolean
  hasPlan: boolean
  onHome: () => void
  onNewPlan: () => void
}

export function HeaderMenu({ userEmail, isPremium, hasPlan, onHome, onNewPlan }: HeaderMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setTheme(getInitialTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open])

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    applyTheme(next)
    window.dispatchEvent(new CustomEvent("pantry-theme-change", { detail: next }))
  }

  const handleHome = () => {
    setOpen(false)
    onHome()
  }

  const handleNewPlan = () => {
    setOpen(false)
    onNewPlan()
  }

  const handleBilling = async () => {
    setOpen(false)
    if (isPremium) {
      try {
        const { url } = await createPortalSession()
        window.location.href = url
      } catch {
        router.push("/pricing")
      }
    } else {
      router.push("/pricing")
    }
  }

  const handleSignOut = async () => {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const isDark = mounted && theme === "dark"

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-9 h-9 flex items-center justify-center rounded-md text-ink hover:bg-chip active:scale-95 transition-all duration-150"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-bg border border-line rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2 text-xs text-muted">
              <User size={12} />
              <span>Signed in as</span>
            </div>
            <div className="text-sm text-ink truncate mt-0.5">{userEmail}</div>
          </div>

          <div className="py-1">
            <MenuItem icon={<Home size={16} />} label="Home" onClick={handleHome} />
            {hasPlan && (
              <MenuItem icon={<Sparkles size={16} />} label="New plan" onClick={handleNewPlan} />
            )}
            <MenuItem
              icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
              label={isDark ? "Light mode" : "Dark mode"}
              onClick={toggleTheme}
            />
            <MenuItem
              icon={<CreditCard size={16} />}
              label={isPremium ? "Manage subscription" : "Upgrade to Premium"}
              onClick={handleBilling}
              accent={!isPremium}
            />
          </div>

          <div className="border-t border-line py-1">
            <MenuItem icon={<LogOut size={16} />} label="Sign out" onClick={handleSignOut} />
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  accent = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-chip transition-colors ${
        accent ? "text-accent font-medium" : "text-ink"
      }`}
    >
      <span className="text-muted">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
