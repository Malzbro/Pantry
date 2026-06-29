"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Leaf } from "@/components/Leaf"
import { ThemeToggle } from "@/components/ThemeToggle"

// All meal images verified against the dish they represent.
// FALLBACK swaps in via <img onError> if any Unsplash entry ever 404s.
const FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"

const MEALS = [
  { title: "Thai Green Curry",    cuisine: "Thai",    cost: "1.82", day: "Mon", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80" },
  { title: "Spaghetti Bolognese", cuisine: "Italian", cost: "1.45", day: "Tue", img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80" },
  { title: "Chicken Stir Fry",    cuisine: "Chinese", cost: "1.68", day: "Wed", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80" },
  { title: "Bean Chilli",         cuisine: "Mexican", cost: "1.20", day: "Thu", img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80" },
  { title: "Herb Roast Chicken",  cuisine: "British", cost: "1.55", day: "Fri", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80" },
  { title: "Veggie Fajitas",      cuisine: "Mexican", cost: "1.30", day: "Sat", img: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=600&q=80" },
  { title: "Lemon Salmon",        cuisine: "British", cost: "2.10", day: "Sun", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80" },
]

const STATS = [
  { value: "£35", label: "avg weekly spend" },
  { value: "7",   label: "dinners per plan" },
  { value: "<1m", label: "to generate" },
]

// Consistent inline-SVG icon set, single stroke weight, replaces the
// emoji + text-symbol mix that was a generic-AI tell.
type IconProps = { className?: string }
const StrokeIcon = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
)

const IconCoin = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9H11a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 7v1.5M12 15.5V17" />
  </svg>
)
const IconSwap = ({ className }: IconProps) => (
  <StrokeIcon className={className} d="M7 7h11M7 7l3-3M7 7l3 3M17 17H6M17 17l-3-3M17 17l-3 3" />
)
const IconLeaf = ({ className }: IconProps) => (
  <StrokeIcon className={className} d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16zM4 20l8-8" />
)
const IconList = ({ className }: IconProps) => (
  <StrokeIcon className={className} d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
)
const IconPhone = ({ className }: IconProps) => (
  <StrokeIcon className={className} d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />
)
const IconSpark = ({ className }: IconProps) => (
  <StrokeIcon className={className} d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
)

const FEATURES = [
  { Icon: IconCoin,  title: "Budget-first planning",     desc: "Every plan fits your budget. The algorithm re-weights at every step to keep spend honest — not approximately, actually." },
  { Icon: IconSwap,  title: "Swap any meal",             desc: "Don't fancy something? Swap it for an alternative that still fits the plan and the budget. One tap." },
  { Icon: IconLeaf,  title: "Dietary-aware",             desc: "Vegetarian, halal, gluten-free — hard constraints handled in code, not guesswork." },
  { Icon: IconList,  title: "Smart shopping list",       desc: "Ingredients de-duplicated across the week, grouped by supermarket aisle, scaled to your household." },
  { Icon: IconPhone, title: "Works on your phone",       desc: "Install Pantry to your home screen. Use it in the supermarket — no app store needed." },
  { Icon: IconSpark, title: "Picks you'll actually like", desc: "Choose a vibe — Quick & Easy, High Protein, Fakeaway — and Pantry matches your taste." },
]

const TESTIMONIALS = [
  { name: "Sarah M.", location: "Manchester", text: "We went from spending £80 a week to under £45. The meal plans are actually good — my kids don't even complain." },
  { name: "James K.", location: "Bristol",    text: "I used to waste so much food. Now I buy exactly what I need and the shopping list is spot on every time." },
  { name: "Priya R.", location: "London",     text: "Finally something that handles vegetarian properly. Not just 'remove the meat' — actual balanced meals." },
]

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()

// Shared button class — accent-tinted shadow, active-press feedback, focus ring.
const PRIMARY_BTN =
  "inline-flex items-center justify-center px-8 py-3.5 bg-accent text-accent-fg rounded-md font-medium text-base " +
  "shadow-[0_4px_14px_-4px_rgba(107,39,55,0.4)] hover:shadow-[0_8px_20px_-4px_rgba(107,39,55,0.45)] " +
  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"

const SECONDARY_BTN =
  "inline-flex items-center justify-center px-8 py-3.5 border border-line text-ink rounded-md font-medium text-base " +
  "hover:bg-chip active:scale-[0.98] transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"

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
    <div className="min-h-screen bg-bg [font-feature-settings:'tnum']">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="border-b border-line sticky top-0 bg-bg/85 backdrop-blur-md z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-ink flex items-center gap-2">
            <Leaf size={16} className="text-accent" />
            Pantry
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in" className="text-sm text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* Tinted accent wash — not a generic linear gradient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-[520px] opacity-[0.07]"
          style={{
            background:
              "radial-gradient(60% 50% at 75% 30%, var(--accent) 0%, transparent 70%)",
          }}
        />
        <div className="container max-w-6xl relative">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div className="hero-stagger">
              <p className="inline-flex items-center gap-2 text-accent font-medium text-[11px] tracking-[0.18em] uppercase mb-5 px-3 py-1.5 rounded-full bg-accent/[0.08] border border-accent/15">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                budget meal planning · uk
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] text-ink leading-[1.04] tracking-[-0.015em] mb-6 [text-wrap:balance]">
                A week of meals.{" "}
                <span className="text-accent italic">Under budget.</span>
              </h1>
              <p className="text-muted text-lg sm:text-xl max-w-[34ch] leading-relaxed mb-8 [text-wrap:pretty]">
                Set your weekly budget — from £20 to £60 — and Pantry builds
                7&nbsp;dinners with a shopping list, all in under a&nbsp;minute.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                <Link href="/sign-up" className={`w-full sm:w-auto text-center ${PRIMARY_BTN}`}>
                  Start planning — it&apos;s free
                </Link>
                <a href="#how-it-works" className={`w-full sm:w-auto text-center ${SECONDARY_BTN}`}>
                  See how it works
                </a>
              </div>

              {/* Stat strip — tabular-num figures for aligned baselines */}
              <dl className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md pt-6 border-t border-line">
                {STATS.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dd className="font-display text-2xl sm:text-3xl text-ink tracking-tight tabular-nums">
                      {s.value}
                    </dd>
                    <dt className="text-[11px] text-muted mt-1 leading-tight tracking-wide lowercase">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Hero image grid — broken-grid composition, asymmetric offsets */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden aspect-[4/3] ring-1 ring-card-border shadow-[0_12px_30px_-12px_rgba(107,39,55,0.18)] -rotate-[0.6deg]">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
                      alt="Colourful salad bowl on a wooden board"
                      onError={handleImgError}
                      loading="eager"
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-square ring-1 ring-card-border shadow-[0_12px_30px_-12px_rgba(107,39,55,0.18)] translate-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"
                      alt="Homemade pizza fresh from the oven"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-10">
                  <div className="rounded-2xl overflow-hidden aspect-square ring-1 ring-card-border shadow-[0_12px_30px_-12px_rgba(107,39,55,0.18)] -translate-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
                      alt="Fresh vegetables on a cutting board"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-[4/3] ring-1 ring-card-border shadow-[0_12px_30px_-12px_rgba(107,39,55,0.18)] rotate-[0.6deg]">
                    <img
                      src="https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80"
                      alt="Warm curry in a ceramic bowl"
                      onError={handleImgError}
                      className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
              {/* Budget badge — accent-tinted shadow, layered over the grid */}
              <div className="absolute -bottom-6 -left-6 bg-bg border border-card-border rounded-2xl px-5 py-4 shadow-[0_18px_40px_-10px_rgba(107,39,55,0.3)]">
                <p className="text-[10px] text-muted mb-1.5 uppercase tracking-[0.14em]">
                  this week&apos;s spend
                </p>
                <p className="font-mono text-2xl text-accent font-semibold leading-none tabular-nums">
                  £32.40
                </p>
                <div className="mt-2.5 h-1.5 w-32 rounded-full bg-chip overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "81%" }} />
                </div>
                <p className="text-[10px] text-muted mt-1.5 tabular-nums">
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
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-[-0.01em] [text-wrap:balance]">
              Three steps. One minute.
            </h2>
          </div>

          <ol className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {[
              { step: "01", title: "Set your budget", desc: "Tell Pantry your weekly budget and household size. Pick a vibe — Quick & Easy, Fakeaway, World Food — or go freeform.", img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", imgAlt: "Notebook with budget plan" },
              { step: "02", title: "Get 7 meals",     desc: "Varied cuisines, real portions, dietary needs respected. Every meal fits the budget — not approximately, actually.",      img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80", imgAlt: "Variety of meals laid out on a table" },
              { step: "03", title: "Shop the list",   desc: "Ingredients aggregated across the week, categorised by aisle, and scaled to your household. Ready for the supermarket.",  img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80", imgAlt: "Hand reaching into a grocery basket" },
            ].map((item, i) => (
              <li
                key={item.step}
                data-reveal
                className="reveal-section group list-none"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-5 ring-1 ring-card-border shadow-[0_10px_24px_-12px_rgba(107,39,55,0.2)]">
                  <img
                    src={item.img}
                    alt={item.imgAlt}
                    onError={handleImgError}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <span className="font-mono text-xs text-accent font-medium tabular-nums tracking-wider">
                  {item.step}
                </span>
                <h3 className="font-display text-xl text-ink mt-2 mb-3 tracking-[-0.005em]">
                  {item.title}
                </h3>
                <p className="text-muted leading-relaxed max-w-[42ch]">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Sample meal plan ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-line bg-chip/30">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-ink mb-3 tracking-[-0.01em] [text-wrap:balance]">
              Here&apos;s what a £40 week looks like
            </h2>
            <p className="text-muted max-w-[48ch] mx-auto [text-wrap:pretty]">
              7 dinners for a household of 2. Real recipes, real prices,
              actually delicious.
            </p>
          </div>

          <div data-reveal className="reveal-section">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {MEALS.map((meal) => (
                <article
                  key={meal.title}
                  className="group rounded-xl border border-card-border bg-bg overflow-hidden hover:border-card-border-hover hover:-translate-y-1 hover:shadow-[0_14px_30px_-14px_rgba(107,39,55,0.28)] transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={meal.img}
                      alt={meal.title}
                      onError={handleImgError}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded-md bg-bg/90 text-ink border border-card-border backdrop-blur-sm">
                      {meal.day}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-ink text-sm leading-tight mb-1">
                      {meal.title}
                    </p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted">{meal.cuisine}</span>
                      <span className="font-mono text-xs text-accent font-medium tabular-nums">
                        £{meal.cost}<span className="text-muted">/serving</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}

              {/* Budget summary card — varied radius, accent tint */}
              <article className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4 flex flex-col justify-center items-center text-center">
                <p className="text-[10px] text-muted uppercase tracking-[0.14em] mb-2">
                  weekly total
                </p>
                <p className="font-mono text-3xl text-accent font-semibold mb-1 leading-none tabular-nums">
                  £32.40
                </p>
                <p className="text-sm text-muted mb-4 tabular-nums">
                  £7.60 under budget
                </p>
                <Link
                  href="/sign-up"
                  className="text-sm px-5 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Try it yourself
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — asymmetric mixed-size grid, consistent stroke icons ── */}
      <section className="py-20 sm:py-28 border-t border-line">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-[-0.01em]">
              Why Pantry
            </h2>
            <p className="text-muted mt-3 max-w-[48ch] mx-auto [text-wrap:pretty]">
              Not another recipe app. A budget tool that happens to plan meals.
            </p>
          </div>

          {/* 6 features in a 6-col grid: first item spans 4 cols on lg as the
              "anchor" — breaks the standard 3x2 monotony. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
            {FEATURES.map((item, i) => {
              const Icon = item.Icon
              const featured = i === 0
              return (
                <div
                  key={item.title}
                  data-reveal
                  className={`reveal-section rounded-xl border border-card-border p-6 hover:border-card-border-hover hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(107,39,55,0.22)] transition-all duration-300 ${
                    featured ? "lg:col-span-4 lg:bg-chip/30" : "lg:col-span-2"
                  }`}
                  style={{ transitionDelay: `${(i % 3) * 80}ms` }}
                >
                  <span
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent mb-4 ring-1 ring-accent/10"
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className={`font-display text-ink mb-2 tracking-[-0.005em] ${featured ? "text-2xl" : "text-lg"}`}>
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed max-w-[44ch]">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-line bg-chip/30">
        <div className="container max-w-5xl">
          <div data-reveal className="reveal-section text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-[-0.01em]">
              Real people, real savings
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                data-reveal
                className="reveal-section relative rounded-xl border border-card-border bg-bg p-6 flex flex-col"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute top-3 right-5 font-display text-6xl text-accent/15 leading-none select-none"
                >
                  &ldquo;
                </span>
                <blockquote className="text-ink leading-relaxed mb-5 text-sm relative flex-1">
                  {t.text}
                </blockquote>
                {/* Author block pinned to bottom — aligns baselines across cards */}
                <figcaption className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-medium text-xs ring-1 ring-accent/15">
                    {initials(t.name)}
                  </div>
                  <div>
                    <p className="text-ink font-medium text-sm leading-tight">{t.name}</p>
                    <p className="text-muted text-xs">{t.location}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 border-t border-line overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 100%, var(--accent) 0%, transparent 70%)",
          }}
        />
        <div data-reveal className="container max-w-2xl text-center reveal-section relative">
          <Leaf size={24} className="text-accent mx-auto mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4 tracking-[-0.01em] [text-wrap:balance]">
            Start saving on your weekly shop
          </h2>
          <p className="text-muted mb-8 max-w-[44ch] mx-auto [text-wrap:pretty]">
            Free to use. Premium unlocks unlimited plans, pantry tracking,
            and more — from £5.99/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up" className={`w-full sm:w-auto ${PRIMARY_BTN}`}>
              Get started — free
            </Link>
            <Link href="/pricing" className={`w-full sm:w-auto ${SECONDARY_BTN}`}>
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
          <nav aria-label="Legal" className="flex items-center gap-4 text-xs text-muted">
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
