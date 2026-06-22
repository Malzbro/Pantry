# Pantry — Business & Build Plan

*A budget-led UK meal-planning SaaS. This document covers the product, the full feature set, the technical architecture, the build roadmap, monetisation, marketing, the real risks, and an honest assessment of whether this is worth committing to.*

---

## 1. The one-line thesis

**Pantry helps UK households plan a week of meals around a budget, then proves how much they saved.**

Everything in this plan flows from that sentence. The meal planning is the *mechanism*; the saved-money number is the *product*. If a user can't feel the saving every week, nothing else matters and the business fails. Hold onto that as the single guiding filter for every feature decision below.

The wedge is **cost-of-living UK meal planning** — an underserved niche, not a saturated one. Mealime, Samsung Food/Whisk, Paprika and Plan to Eat all compete on recipes and convenience. Almost none lead with *cost*, and none do it well for UK supermarkets. That gap is the entire opportunity. Protect it; don't dilute it.

---

## 2. Mobile app vs web app — the decision

**Verdict: build a mobile-first Progressive Web App (PWA) for v1. Defer native apps to year two, if ever.**

### Why PWA first

| Factor | PWA | Native (iOS + Android) |
|---|---|---|
| Build time to v1 | Fast — one codebase | 2–3x longer, or two codebases |
| You already have | A Vercel/Next.js web app | Nothing |
| App Store tax | None | 15–30% of every subscription |
| Update cycle | Instant deploy | App review delays |
| Push notifications | Yes (iOS 16.4+ supports web push) | Yes |
| Discoverability | SEO-driven (your main channel) | App Store search (pay-to-play) |
| "Add to home screen" | Yes, feels app-like | Native install |

The retention lever in this category is the **weekly habit**, and that's driven by notifications + a fast planning flow, both of which a PWA does fine. The App Store's 15–30% cut is brutal on a £6/month product. And your primary growth channel is SEO/content, which sends people to a *web URL*, not an app listing.

### When to revisit native

Go native only when (a) you have meaningful paying users, (b) push/widget/offline limitations are demonstrably costing you retention, and (c) you can afford the App Store cut. That's a year-two conversation backed by data, not a launch decision.

> **Note:** keep the codebase native-friendly from day one anyway — a React/Next.js PWA can later be wrapped (Capacitor) or rebuilt in React Native sharing much of the logic. Don't paint yourself into a corner, but don't build the corner either.

---

## 3. App structure & architecture

### 3.1 High-level structure

```
Pantry
├── Public / Marketing
│   ├── Landing page (cost-saving hook, not tech)
│   ├── SEO content hub (budget recipes, guides)
│   ├── Pricing page
│   └── Auth (sign up / log in / reset)
│
├── Onboarding (< 2 min)
│   ├── Recipe swipe deck (12–15 cards)
│   ├── 2–3 slider questions (household, budget, hard constraints)
│   └── First plan generated → immediate "aha"
│
├── Core App (logged in)
│   ├── This Week (the home screen — the plan)
│   ├── Planner (generate / swap / skip / regenerate)
│   ├── Pantry (probabilistic inventory + weekly check-in)
│   ├── Shopping List (deep links + affiliate tags + cost)
│   ├── Budget Dashboard (planned vs actual, savings)
│   ├── Recipe view (with 👍/👎/🔥 feedback)
│   └── Settings (preferences, households, dietary, account)
│
├── Premium (paywalled)
│   ├── Reverse recipe generation
│   ├── Email receipt scanning (auto-pantry)
│   ├── Unlimited plan history
│   ├── Multi-household profiles
│   ├── Reduced-friendly ("yellow sticker") mode
│   └── Advanced constraints & analytics
│
└── Billing
    ├── Stripe checkout
    ├── Subscription management portal
    └── Free → paid upgrade prompts
```

### 3.2 Recommended tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js on Vercel | You're already here; great PWA + SEO story |
| Auth | Clerk *or* Supabase Auth | Clerk is fastest to ship; Supabase bundles with your DB |
| Database | Postgres (Supabase or Neon) | Relational fits recipes/pantry/users cleanly |
| Payments | **Stripe** (Subscriptions + Billing Portal) | Handles UK VAT, cards, Apple/Google Pay |
| Transactional email | Resend | Receipts, resets, weekly nudges |
| LLM | Anthropic API (Claude) | Planning, reverse recipes, week-context parsing |
| OCR (later) | Google Cloud Vision | Receipt scanning, ~£0.001/receipt |
| Price data | Trolley.co.uk API *or* curated DB | See §4 |
| Analytics | PostHog (free tier) | Funnels, retention cohorts |
| Error tracking | Sentry | Catch breakage in production |
| Affiliate | Awin | Tesco/Sainsbury's/Ocado all run through it |

### 3.3 The core data model (sketch)

- **User** — auth id, household profile(s), preference vector, plan, budget settings
- **Recipe** — ingredients, steps, photo, and tag vector: `spice 0–5`, `sauce 0–5`, `richness 0–5`, `effort 0–5`, `familiarity 0–5`, `prep_mins`, dietary flags, cost estimate
- **PreferenceVector** — per user, same axes as recipe tags; seeded by swipes, updated by ratings
- **PantryItem** — ingredient, quantity (fuzzy), source (`receipt`/`assumed`/`manual`), confidence, expiry window
- **Plan** — week, list of meals, projected cost
- **ShoppingList** — derived from plan minus pantry, with per-item supermarket links + prices
- **Reconciliation** — projected cost vs actual (from receipt/manual), the savings delta

The preference vector + recipe tag vectors are the heart of the "feels like it knows me" experience. Don't ask users abstract questions — let swipes and one-tap ratings populate these silently.

---

## 4. Feature build — full list, grouped by phase

Features are sequenced so each phase ships something usable. **Don't build ahead.**

### Phase 0 — Foundation *(must exist before you can charge a penny)*

- [ ] Auth: sign up, log in, password reset, email verification, OAuth (Google) option
- [ ] Login/account screens (see §5 for the full screen list)
- [ ] Postgres schema + migrations
- [ ] Stripe subscriptions + billing portal + webhook handling
- [ ] Free vs paid entitlement gating (feature flags per tier)
- [ ] Transactional email (welcome, reset, receipt)
- [ ] Mobile-responsive PWA shell + "add to home screen"
- [ ] Error tracking (Sentry) + analytics (PostHog)
- [ ] Legal: privacy policy, terms, cookie consent (privacy-preserving default)

### Phase 1 — Core product loop *(the reason people stay)*

- [ ] Onboarding swipe deck (12–15 cards spanning all taste axes)
- [ ] 2–3 slider questions: household size, weekly budget, hard constraints
- [ ] Weekly planning UI: generate a plan, swap a meal, skip a night, regenerate
- [ ] Pantry with **assumed-depletion** logic + 5-second weekly check-in
- [ ] Shopping list = plan minus pantry, with supermarket **deep links + Awin tags**
- [ ] Price database (start curated, ~2,000 common UK ingredients)
- [ ] Budget dashboard: **projected vs actual**, "saved £X this week/month"
- [ ] Recipe view with one-tap feedback (👍 / 👎 / 🔥 more like this)
- [ ] Optional "anything special this week?" free-text box → LLM planning context

### Phase 2 — Premium tier *(the monetisation hook)*

- [ ] **Reverse recipe generation** — "what can I make from what I have?" (pairs with pantry)
- [ ] **Email receipt scanning** — Gmail/Outlook OAuth or unique forwarding address, auto-populates pantry
- [ ] Unlimited plan history (free tier capped at e.g. 3–5 saved plans)
- [ ] Multi-household / multiple profiles
- [ ] Advanced dietary constraints (per-person, per-day rules)
- [ ] **Reduced-friendly mode** — biases plans toward categories that get yellow-stickered (bakery, chilled meat/fish, salads); the smart fake, no impossible data feed required
- [ ] Budget analytics (trends, cost-per-meal, biggest savings)

### Phase 3 — Growth & defensibility *(force-multipliers, post-launch only)*

- [ ] Browser extension: auto-fill supermarket basket from shopping list + read order history into pantry
- [ ] Receipt OCR (photo) as a fallback to email scanning
- [ ] Referral mechanic ("give a friend a free month")
- [ ] SEO content hub (programmatic budget-recipe pages)
- [ ] Community-sourced reduced-item reporting (only viable once you have local density)
- [ ] Too Good To Go integration (food-waste angle alongside cost)

---

## 5. Login, account & payment screens (the full checklist)

Often underestimated — this is several days of work on its own and must be solid before launch.

**Authentication**
- Sign up (email + password, plus "Continue with Google")
- Log in
- Forgot password / reset password
- Email verification / confirm email
- Magic-link option (optional, reduces friction)

**Account & settings**
- Profile (name, household size, preferences sliders)
- Dietary & constraints (allergies, vegetarian/vegan, dislikes)
- Households / profiles management (premium)
- Notification preferences (weekly nudge, savings recap)
- Connected accounts (Gmail/Outlook for receipts — premium)
- Privacy controls + data export/delete (GDPR — legally required)

**Billing (Stripe)**
- Pricing page (free vs premium, monthly vs annual)
- Checkout (Stripe Checkout — handles card, Apple/Google Pay, VAT)
- Manage subscription (Stripe Billing Portal — upgrade, downgrade, cancel, update card)
- Upgrade prompts at the paywall boundaries (e.g. when a free user hits the plan-history cap or taps a premium feature)
- Payment failure / dunning handling (Stripe handles retries; you handle the in-app messaging)

> **Do not handle raw card data yourself.** Stripe Checkout / Billing Portal keeps you out of PCI scope entirely. Never build your own card form.

---

## 6. Monetisation model

### 6.1 Pricing

| Tier | Price | What's included |
|---|---|---|
| **Free** | £0 | Limited saved plans (3–5), basic planning, shopping list, basic budget view |
| **Premium monthly** | **£5.99/mo** | Everything: reverse recipes, receipt scanning, unlimited history, households, reduced mode, analytics |
| **Premium annual** | **£39/yr** (~£3.25/mo) | Same as premium, ~45% saving — improves LTV, smooths early churn |

Price the subscription to sit *obviously below* the saving you demonstrate. If the dashboard says "saved £14 this week," £5.99/month sells itself. That's why the savings number is the product.

### 6.2 Revenue streams (stacked, not either/or)

1. **Subscriptions** — the core. 75–85% gross margin.
2. **Grocery affiliate (Awin)** — 1–3% of basket value on orders you drive. On an £80 weekly shop that's £0.80–£2.40 per user per week — *potentially doubling effective ARPU* once basket export works well. Doesn't conflict with subscription; stack it.
3. **B2B / white-label (year 2+)** — nutritionists, PTs, weight-management services, housing associations doing cost-of-living support. Don't chase early; it's a distraction until the consumer product is solid.

**Avoid:** sponsored brand recipes (kills the neutral-cost-optimiser trust that *is* your differentiation), one-time purchase (caps upside, kills the recurring relationship), and display ads (terrible UX for a weekly utility app).

---

## 7. Unit economics & revenue projections

### 7.1 Cost to build & run

**During build:** £30–80/month (Vercel, Supabase, domain, LLM testing).

**Live, variable costs:**
- LLM inference: ~£0.02–0.10 per plan generation
- Receipt OCR: ~£0.001 per receipt
- Stripe: 1.5% + 20p per UK transaction
- Email: ~£20/mo
- Price data (if Trolley): budget £100–300/mo

**Realistic monthly fixed cost:** £50–150 early, scaling to £500–1,500 at ~1,000 paying users. Gross margin stays a healthy **75–85%**.

**If you hired this out instead of building it:** £30k–80k for a competent indie team to deliver v1. Doing it yourself is dramatically better economics at this stage.

### 7.2 Revenue at £5.99/mo

| Paying users | Gross / mo | Net / mo (approx) |
|---|---|---|
| 100 | ~£600 | ~£500 |
| 500 | ~£3,000 | ~£2,500 |
| 1,000 | ~£6,000 | ~£5,000 |
| 5,000 | ~£30,000 | ~£25,000 |

Affiliate revenue (post-v1, once basket export works) could meaningfully add to each row.

### 7.3 The conversion & churn reality *(read this twice)*

- Consumer free→paid conversion: typically **2–5%**
- Consumer monthly churn: **5–10%** (much worse than B2B)

To **stand still** at 1,000 paying users with 8% monthly churn, you must acquire **~80 new paying users every month** — at 3% conversion that's **~2,700 free signups monthly**. That is a real, ongoing marketing operation, not a side effect of having a nice product. This single fact is why most consumer apps in this category plateau or die. Internalise it now.

### 7.4 Time to profitability

- **Cover running costs** (£100–500/mo): achievable 6–12 months post-launch *if marketing works at all*.
- **Cover running costs + a ~£40k/yr salary** (~£3,300/mo): realistically **18–30 months from launch**, and only if you reach ~800–1,200 paying users.

Many indie consumer apps never reach the salary line. Some do beautifully. The deciding variable is marketing stamina and retention, not feature count.

---

## 8. Build timeline

### Solo, full-time
**4–6 months to a chargeable v1**, then 6–18 months of iteration + marketing before meaningful revenue.

| Month | Focus |
|---|---|
| 1 | Foundation: auth, DB, Stripe, account/billing screens, dashboard shell |
| 2 | Core loop: weekly planner, pantry (assumed depletion), shopping list |
| 3 | Onboarding (swipes + sliders), price DB, budget tracking |
| 4 | Premium tier behind paywall (reverse recipes + receipt scanning), landing page rebuild, beta to friends/Reddit |
| 5–6 | Fix what beta breaks, SEO infrastructure, soft launch |
| 7+ | The long slog: marketing, retention, iteration |

### Solo, evenings & weekends (10–15 hrs/wk)
**9–14 months to v1**, then 18–30+ months to meaningful revenue. Same sequence, stretched ~2.5x.

**Do not build in v1:** browser extension, native apps, community reporting, calorie/fitness modes. They're force-multipliers, not foundations, and they'll eat the time you need for the core loop and marketing.

---

## 9. Social media & content marketing plan

Paid ads almost never work at this price point — you'd pay £15–40 to acquire a user worth ~£6/month who churns in 6 months. **Organic is the whole game.** Plan to spend roughly as much time on distribution as on code post-launch.

### 9.1 The channels, ranked

**1. SEO / content hub (your compounding asset).**
Target high-intent cost-of-living queries: "cheap family meals UK," "meal plan for £30 a week," "budget meal planner," "Tesco meal deals recipes." Build a content hub of genuinely useful budget recipes and guides, each with a soft CTA into the app. This compounds for years and costs only your time. **The single highest-ROI channel for this niche.**

**2. TikTok / Instagram Reels (the awareness engine).**
Short-form video is where UK cost-of-living content thrives. Format ideas:
- "A week of dinners for two for £25" — show the plan, the shop, the cooking
- "Reduced-section haul → 5 meals" — leans into the yellow-sticker angle
- "I let an app plan my meals for a month — here's what I saved"
- Before/after grocery bills
Post 4–5x/week. Consistency beats production value. Repurpose each video across TikTok, Reels, and YouTube Shorts.

**3. Reddit (careful, high-trust).**
r/UKPersonalFinance, r/EatCheapAndHealthy, r/MealPrepSunday, r/povertyfinanceUK. **Do not spam.** Be a genuine participant; share the savings angle and the free tool where it authentically helps. One good organic post outperforms 50 promotional ones — and the wrong approach gets you banned.

**4. The UK growth grail: Money Saving Expert / press.**
A mention in MoneySavingExpert, or coverage in cost-of-living press (Metro, The Sun money pages, BBC, regional press), is the genuine breakout channel for this niche. Pitch a data story: "App users save an average £X/month on groceries." Build the PR angle into the product (you'll have the savings data) and pitch journalists once you have real numbers.

**5. Email list (own your audience).**
Capture emails *before* signup with a lead magnet ("Free £25 weekly meal plan PDF"). Weekly newsletter with a budget recipe + a savings tip keeps you top-of-mind and isn't at the mercy of an algorithm.

**6. Referral loop (in-product).**
"Give a friend a free month, get one free." Cheap, compounds, and consumer meal-saving is naturally word-of-mouth ("how are you feeding the family for so little?").

### 9.2 A realistic weekly cadence (post-launch)

| Channel | Cadence |
|---|---|
| TikTok / Reels / Shorts | 4–5 short videos |
| SEO articles | 1–2 quality posts |
| Reddit / community | Participate genuinely, 2–3x; never spam |
| Email newsletter | 1x |
| PR pitches | Ongoing, batched monthly once you have data |

---

## 10. The hard parts — where this project actually breaks

Be clear-eyed. The build is the *easy* part. Three things kill apps in this category:

### 10.1 Retention (the #1 killer)
People download meal planners and quit within 1–2 weeks because the weekly effort doesn't feel worth it. Your *only* defence is making the value felt every single week: the savings number on the dashboard, the "you saved £X this month" notification, the pantry that remembers so planning takes 5 minutes not 25. If the differentiation isn't *felt weekly*, you're shipping water in a sieve. Engineer the habit deliberately.

### 10.2 Acquisition cost & the marketing grind
Organic-only growth is slow and demands relentless content output. Most technical founders underestimate how much sustained, non-coding effort this takes. You will be making TikToks and writing SEO posts long after the code is "done." If you hate that, partner with someone who doesn't.

### 10.3 Focus
The temptation to bolt on fitness mode, family social feeds, calorie tracking, and everything else will be constant. **Win on one axis — UK cost-of-living meal planning — before broadening.** Feature sprawl dilutes the wedge and burns the time you need for retention and marketing.

### 10.4 Specific technical friction points
- **No clean supermarket basket API exists.** Deep links work day one; the browser extension is the real (post-v1) solution; direct partnerships need traction first.
- **Pantry inference is fundamentally imperfect.** There's no purely passive way to know a kitchen's contents. The fix is probabilistic modelling ("we *think* you have…") + email receipts + assumed depletion, *not* a precise inventory you'll never achieve. Framing it as a best-guess buys forgiveness for being wrong.
- **Yellow-sticker data doesn't exist as a feed.** Ship "reduced-friendly mode" (bias toward categories that get reduced) — the smart fake delivers ~80% of the value with 0% of the impossible data problem.
- **Price data is a maintenance burden.** Trolley's API removes it if you can get access; otherwise a curated DB needs periodic updates, helped over time by receipt-scanning feedback.

---

## 11. Honest probability assessment

### If you build it and *don't* get clients initially
This is the **default and expected outcome** for the first weeks-to-months. Launching to crickets is normal; it is **not** a signal to quit. The compounding channels (SEO, content library, referral) take months to gain traction by design. Almost every successful indie consumer app had a quiet opening. The question isn't "did launch go quiet" — it always does — it's "will you keep shipping content and iterating for the 6–18 months it takes traction to compound."

### Rough probability bands *(directional, not precise)*
- **Will you be able to build a polished, sellable v1?** Very high (~90%+) if you commit the time — you already have the engine and the technical capability.
- **Will it cover running costs within ~12 months of real marketing effort?** Plausible (~40–60%) — depends almost entirely on whether you sustain content output.
- **Will it reach "covers a salary" (~1,000 paying users)?** Genuinely hard (~10–25%) — this is where most consumer apps plateau. Achievable, but only with relentless retention + marketing work, and likely a Money-Saving-Expert-tier breakout moment.
- **Will it become a large business (5,000+ paying users)?** Low base rate (~5%), as with all consumer SaaS — but the cost-of-living wedge is a real, underserved one, which tilts the odds more favourably than a generic meal app.

### The deciding factors (in order)
1. **Retention engineering** — is the saving felt weekly?
2. **Marketing stamina** — will you make content for a year+ through the quiet?
3. **Focus** — will you resist feature sprawl and own the one wedge?
4. Technical execution — important, but the *least* likely thing to kill you.

### The bottom line
You haven't picked a saturated niche — you've found an underserved one, and that's the hard part most people get wrong. The build is achievable. Whether it becomes a business depends far more on retention and marketing endurance than on any single feature. If you can commit to the long, quiet, content-heavy middle stretch — and treat the early silence as expected rather than as failure — this has a real, if difficult, path to profitability. If you can't commit to that stretch, no feature list will save it.

---

## 12. Recommended immediate next steps

1. **Rewrite the landing page** to lead with the saving ("Plan a week of UK meals for under £X"), not the tech stack. The AI is *how*, not *what*.
2. **Lock the price data path** — email Trolley.co.uk for API access; in parallel, start a curated DB of ~2,000 ingredients. Cost tracking *is* the product; without real prices the budget angle is theatre.
3. **Build Phase 0 foundation** — auth, DB, Stripe, account/billing screens.
4. **Sign up to Awin** and wire affiliate tags into shopping-list deep links from day one — it earns even at Tier-1 deep links.
5. **Start the content engine now**, in parallel with building — an SEO library and TikTok presence take months to warm up, so don't wait for launch to begin.

---

*Built to be edited. Adjust the assumptions — price point, conversion, churn, build pace — and the projections move with them. Treat this as a living document, not a finished one.*
