"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Leaf } from "@/components/Leaf"
import { ThemeToggle } from "@/components/ThemeToggle"

export function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg text-ink flex items-center gap-2"
          >
            <Leaf size={16} className="text-accent" />
            Pantry
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-20 sm:pt-32 sm:pb-28">
        <div className="container max-w-3xl text-center">
          <div className="hero-stagger">
            <p className="text-accent font-medium text-sm tracking-wide uppercase mb-4">
              Budget meal planning for the UK
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.1] mb-6">
              A week of meals.{" "}
              <span className="text-accent">Under budget.</span>
            </h1>
            <p className="text-muted text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              Set your weekly budget — from £20 to £60 — and Pantry
              builds 7&nbsp;dinners with a shopping list, all in under
              a&nbsp;minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto px-8 py-3 bg-accent text-accent-fg rounded-md font-medium text-base hover:opacity-90 transition-opacity"
              >
                Start planning — it&apos;s free
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-3 border border-line text-ink rounded-md font-medium text-base hover:bg-chip transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28 border-t border-line">
        <div className="container max-w-4xl">
          <div data-reveal className="reveal-section text-center mb-16">
            <Leaf size={20} className="text-accent mx-auto mb-4" />
            <h2 className="font-display text-3xl sm:text-4xl text-ink">
              Three steps. One minute.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: "01",
                title: "Set your budget",
                desc: "Tell Pantry your weekly budget and household size. Pick a vibe — Quick & Easy, Fakeaway, World Food — or go freeform.",
              },
              {
                step: "02",
                title: "Get 7 meals",
                desc: "Varied cuisines, real portions, dietary needs respected. Every meal fits the budget — not approximately, actually.",
              },
              {
                step: "03",
                title: "Shop the list",
                desc: "Ingredients aggregated across the week, categorised by aisle, and scaled to your household size. Ready for the supermarket.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                data-reveal
                className="reveal-section"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="font-mono text-sm text-accent font-medium">
                  {item.step}
                </span>
                <h3 className="font-display text-xl text-ink mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 border-t border-line">
        <div className="container max-w-4xl">
          <div data-reveal className="reveal-section text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-ink">
              Why Pantry
            </h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">
              Not another recipe app. A budget tool that happens to plan
              meals.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Budget-first",
                desc: "Every plan fits your budget. The algorithm re-weights options at every step to keep spend honest.",
              },
              {
                title: "Swap any meal",
                desc: "Don't fancy something? Swap it for an alternative that still fits the plan and the budget.",
              },
              {
                title: "Dietary-aware",
                desc: "Vegetarian, halal, gluten-free — hard constraints handled in code, not guesswork.",
              },
              {
                title: "Smart shopping list",
                desc: "Ingredients de-duplicated across the week, grouped by category, household-scaled.",
              },
              {
                title: "Works on your phone",
                desc: "Install Pantry to your home screen. Use it in the supermarket — no app store needed.",
              },
              {
                title: "Picks you'll actually like",
                desc: "Choose a vibe — Quick & Easy, High Protein, Fakeaway — and Pantry matches your taste.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-reveal
                className="reveal-section rounded-lg border border-card-border p-6 hover:border-card-border-hover transition-colors duration-300"
                style={{ transitionDelay: `${(i % 2) * 80}ms` }}
              >
                <h3 className="font-display text-lg text-ink mb-2">
                  {item.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 border-t border-line">
        <div data-reveal className="container max-w-2xl text-center reveal-section">
          <Leaf size={24} className="text-accent mx-auto mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            Start saving on your weekly shop
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            Free to use. Premium unlocks unlimited plans, pantry tracking,
            and more — from £5.99/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Get started — free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-3 border border-line text-ink rounded-md font-medium hover:bg-chip transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Leaf size={14} className="text-accent" />
            <span>Pantry</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link
              href="/terms"
              className="hover:text-ink transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-ink transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
