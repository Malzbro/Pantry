import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Pantry",
  description: "How Pantry collects, uses, and protects your personal data.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-ink">Pantry</Link>
        </div>
      </header>

      <main className="container py-12 sm:py-16 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl text-ink mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-10">Last updated: 23 June 2026</p>

        <Section title="1. Who we are">
          <p>
            Pantry (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a
            UK-based meal planning service. If you have questions about this policy,
            contact us at{" "}
            <a href="mailto:hello@pantryplan.co.uk" className="underline hover:text-ink">
              hello@pantryplan.co.uk
            </a>.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <p>We collect only what we need to run the service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-ink">Account data</strong> — email address and
              hashed password (or Google OAuth profile) when you sign up.
            </li>
            <li>
              <strong className="text-ink">Household &amp; preference data</strong> — household
              size, dietary requirements, budget, appliance availability, and taste preferences
              you provide during onboarding and planning.
            </li>
            <li>
              <strong className="text-ink">Meal plan data</strong> — plans generated,
              meals swapped, and shopping lists viewed.
            </li>
            <li>
              <strong className="text-ink">Payment data</strong> — processed by Stripe.
              We never see or store your full card number. Stripe&rsquo;s privacy policy
              applies to payment processing.
            </li>
            <li>
              <strong className="text-ink">Push notification tokens</strong> — if you
              opt in to web push notifications, we store the subscription endpoint to
              deliver messages.
            </li>
            <li>
              <strong className="text-ink">Usage analytics</strong> — anonymised
              page views, feature usage, and performance metrics to improve the product.
            </li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc pl-5 space-y-1">
            <li>Generate personalised meal plans and shopping lists.</li>
            <li>Process payments and manage your subscription.</li>
            <li>Send transactional emails (welcome, password reset, receipts).</li>
            <li>Send optional push notifications (weekly plan reminders, savings updates).</li>
            <li>Improve the service through aggregated, anonymised analytics.</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use your data for advertising.
          </p>
        </Section>

        <Section title="4. Third-party services">
          <p>We share data with these processors, only as needed to operate the service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-ink">Supabase</strong> — authentication and
              database hosting (EU region).
            </li>
            <li>
              <strong className="text-ink">Stripe</strong> — payment processing.
            </li>
            <li>
              <strong className="text-ink">Resend</strong> — transactional email delivery.
            </li>
            <li>
              <strong className="text-ink">Vercel</strong> — web application hosting.
            </li>
          </ul>
          <p>Each processor has its own privacy policy and is GDPR-compliant.</p>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use strictly necessary cookies for authentication and session management.
            We do not use advertising or tracking cookies. If we introduce analytics
            cookies in the future, we will ask for your consent first.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            We keep your account and plan data for as long as your account is active.
            If you delete your account, we remove your personal data within 30 days.
            Anonymised, aggregated data may be retained indefinitely for analytics.
          </p>
        </Section>

        <Section title="7. Your rights (UK GDPR)">
          <p>Under UK data protection law, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Export your data in a portable format.</li>
            <li>Withdraw consent for optional processing (e.g. push notifications).</li>
            <li>Lodge a complaint with the ICO (ico.org.uk).</li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a href="mailto:hello@pantryplan.co.uk" className="underline hover:text-ink">
              hello@pantryplan.co.uk
            </a>.
          </p>
        </Section>

        <Section title="8. Data security">
          <p>
            All data is transmitted over HTTPS. Passwords are hashed and never stored
            in plain text. Payment data is handled entirely by Stripe and never touches
            our servers. We use row-level security policies on our database to ensure
            users can only access their own data.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            Pantry is not directed at children under 16. We do not knowingly collect
            data from anyone under 16. If you believe a child has provided us with
            personal data, please contact us and we will delete it.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. We will notify you of material
            changes by email or an in-app notice. The &ldquo;last updated&rdquo; date
            at the top of this page reflects the latest revision.
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-line flex items-center gap-4 text-sm text-muted">
          <Link href="/terms" className="underline hover:text-ink">Terms of Service</Link>
          <span>&middot;</span>
          <Link href="/" className="underline hover:text-ink">Back to Pantry</Link>
        </div>
      </main>
    </div>
  )
}
