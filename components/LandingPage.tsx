"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Leaf } from "@/components/Leaf"
import { ThemeToggle } from "@/components/ThemeToggle"

// Known-stable Unsplash IDs, each verified against the meal it represents.
// `FALLBACK` is used by <img onError> if a CDN entry ever 404s.
const FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"

const MEALS = [
  { title: "Thai Green Curry",   cuisine: "Thai",    cost: "£1.82", day: "Mon", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80" },
  { title: "Spaghetti Bolognese", cuisine: "Italian", cost: "£1.45", day: "Tue", img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80" },
  { title: "Chicken Stir Fry",    cuisine: "Chinese", cost: "£1.68", day: "Wed", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80" },
  { title: "Bean Chilli",         cuisine: "Mexican", cost: "£1.20", day: "Thu", img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80" },
  { title: "Herb Roast Chicken",  cuisine: "British", cost: "£1.55", day: "Fri", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80" },
  { title: "Veggie Fajitas",      cuisine: "Mexican", cost: "£1.30", day: "Sat", img: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=600&q=80" },
  { title: "Lemon Salmon",        cuisine: "British", cost: "£2.10", day: "Sun", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80" },
]

const STATS = [
  { value: "£35", label: "Avg weekly spend" },
  { value: "7", label: "Dinners per plan" },
  { value: "<1 min", label: "To generate" },
]

const FEATURES = [
  { icon: "💷", title: "Budget-first planning",     desc: "Every plan fits your budget. The algorithm re-weights at every step to keep spend honest — not approximately, actually." },
  { icon: "🔁", title: "Swap any meal",             desc: "Don't fancy something? Swap it for an alternative that still fits the plan and the budget. One tap." },
  { icon: "🌱", title: "Dietary-aware",             desc: "Vegetarian, halal, gluten-free — hard constraints handled in code, not guesswork." },
  { icon: "🛒", title: "Smart shopping list",       desc: "Ingredients de-duplicated across the week, grouped by supermarket aisle, scaled to your household." },
  { icon: "📲", title: "Works on your phone",       desc: "Install Pantry to your home screen. Use it in the supermarket — no app store needed." },
  { icon: "❤️", title: "Picks you'll actually like", desc: "Choose a vibe — Quick & Easy, High Protein, Fakeaway — and Pantry matches your taste." },
]

const TESTIMONIALS = [
  { name: "Sarah M.",  location: "Manchester", text: "We went from spending £80 a week to under £45. The meal plans are actually good — my kids don't even complain." },
  { name: "James K.",  location: "Bristol",    text: "I used to waste so much food. Now I buy exactly what I need and the shopping list is spot on every time." },
  { name: "Priya R.",  location: "London",     text: "Finally something that handles vegetarian properly. Not just 'remove the meat' — actual balanced meals." },
]

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

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
      { threshold: 0.1 }
    )
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget
    if (t.src !== FALLBACK) t.src = FALLBACK
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="border-b border-line sticky top-0 bg-bg/85 backdrop-blur-md z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-ink flex items-center gap-2">
            <Leaf size={16} className="text-accent" />
            Pantry
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in" className="text-sm text-muted hover:text-ink transition-colors">
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* subtle accent wash behind hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-[480px] opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, var(--accent) 0%, transparent 60%)",
          }}
        />
        <div className="container max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="hero-stagger">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] text-ink leading-[1.05] tracking-[-0.01em] mb-6">
                A week of meals.{" "}
                <span className="text-accent">Under budget.</span>
              </h1>
              <p className="text-muted text-lg sm:text-xl max-w-lg leading-relaxed mb-8">
                Set your weekly budget — from £20 to £60 — and Pantry builds
                7&nbsp;dinners with a shopping list, all in under a&nbsp;minute.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto px-8 py-3.5 bg-accent text-accent-fg rounded-md font-medium text-base hover:opacity-90 hover:-translate-y-0.5 transition-all text-center shadow-sm"
                >
                  Start planning — it&apos;s free
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-3.5 border border-line text-ink rounded-md font-medium text-base hover:bg-chip transition-colors text-center"
                >
                  See how it works
                </a>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md pt-6 border-t border-line">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
                      {s.value}
                    </p>
                    <p className="text-xs text-muted mt-1 leading-tight">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero food image grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden aspect-[4/3] shadow-sm ring-1 ring-card-border">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
                      alt="Colourful salad bowl"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden aspect-square shadow-sm ring-1 ring-card-border">
                    <img
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"
                      alt="Homemade pizza"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-10">
                  <div className="rounded-xl overflow-hidden aspect-square shadow-sm ring-1 ring-card-border">
                    <img
                      src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
                      alt="Fresh vegetables"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden aspect-[4/3] shadow-sm ring-1 ring-card-border">
                    <img
                      src="https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80"
                      alt="Warm curry dish"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
              {/* Budget badge overlay */}
              <div className="absolute -bottom-5 -left-5 bg-bg border border-card-border rounded-xl px-5 py-4 shadow-lg">
                <p className="text-[11px] text-muted mb-1 uppercase tracking-wider">
                  This week&apos;s spend
                </p>
                <p className="font-mono text-2xl text-accent font-semibold leading-none">
                  £32.40
                </p>
                <div className="mt-2 h-1.5 w-32 rounded-full bg-chip overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: "81%" }} />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  81% of £40 budget
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 border-t border-line">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-16">
            <Leaf size={20} className="text-accent mx-auto mb-4" />
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
              Three steps. One minute.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                step: "01",
                title: "Set your budget",
                desc: "Tell Pantry your weekly budget and household size. Pick a vibe — Quick & Easy, Fakeaway, World Food — or go freeform.",
                img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
                imgAlt: "Notebook with budget plan",
              },
              {
                step: "02",
                title: "Get 7 meals",
                desc: "Varied cuisines, real portions, dietary needs respected. Every meal fits the budget — not approximately, actually.",
                img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80",
                imgAlt: "Variety of meals on a table",
              },
              {
                step: "03",
                title: "Shop the list",
                desc: "Ingredients aggregated across the week, categorised by aisle, and scaled to your household. Ready for the supermarket.",
                img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
                imgAlt: "Grocery shopping basket",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                data-reveal
                className="reveal-section group"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="rounded-xl overflow-hidden aspect-[16/10] mb-5">
                  <img
                    src={item.img}
                    alt={item.imgAlt}
                    onError={handleImgError}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
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

      {/* ── Sample meal plan ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-line bg-chip/30">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-ink mb-3 tracking-tight">
              Here&apos;s what a £40 week looks like
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              7 dinners for a household of 2. Real recipes, real prices,
              actually delicious.
            </p>
          </div>

          <div data-reveal className="reveal-section">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {MEALS.map((meal, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-card-border bg-bg overflow-hidden hover:border-card-border-hover hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={meal.img}
                      alt={meal.title}
                      onError={handleImgError}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg/90 text-ink border border-card-border backdrop-blur-sm">
                      {meal.day}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-ink text-sm leading-tight mb-1">
                      {meal.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{meal.cuisine}</span>
                      <span className="font-mono text-xs text-accent font-medium">
                        {meal.cost}/serving
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Budget summary card */}
              <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4 flex flex-col justify-center items-center text-center">
                <p className="text-xs text-muted uppercase tracking-wide mb-2">
                  Weekly total
                </p>
                <p className="font-mono text-3xl text-accent font-semibold mb-1 leading-none">
                  £32.40
                </p>
                <p className="text-sm text-muted mb-4">
                  £7.60 under budget
                </p>
                <Link
                  href="/sign-up"
                  className="text-sm px-5 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Try it yourself
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-line">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
              Why Pantry
            </h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">
              Not another recipe app. A budget tool that happens to plan meals.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((item, i) => (
              <div
                key={item.title}
                data-reveal
                className="reveal-section rounded-xl border border-card-border p-6 hover:border-card-border-hover hover:-translate-y-0.5 transition-all duration-300"
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent font-display text-lg mb-4"
                  role="img"
                  aria-label={item.title}
                >
                  {item.icon}
                </span>
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

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-line bg-chip/30">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
              Real people, real savings
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                data-reveal
                className="reveal-section relative rounded-xl border border-card-border bg-bg p-6"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute top-3 right-4 font-display text-5xl text-accent/15 leading-none select-none"
                >
                  &ldquo;
                </span>
                <p className="text-ink leading-relaxed mb-5 text-sm relative">
                  {t.text}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-xs">
                    {initials(t.name)}
                  </div>
                  <div>
                    <p className="text-ink font-medium text-sm leading-tight">{t.name}</p>
                    <p className="text-muted text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 border-t border-line overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, var(--accent) 0%, transparent 60%)",
          }}
        />
        <div data-reveal className="container max-w-2xl text-center reveal-section relative">
          <Leaf size={24} className="text-accent mx-auto mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4 tracking-tight">
            Start saving on your weekly shop
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            Free to use. Premium unlocks unlimited plans, pantry tracking,
            and more — from £5.99/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm"
            >
              Get started — free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-3.5 border border-line text-ink rounded-md font-medium hover:bg-chip transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Leaf size={14} className="text-accent" />
            <span>Pantry</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
