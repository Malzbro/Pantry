import Link from "next/link"

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl text-ink mb-3">
          No problem
        </h1>
        <p className="text-muted mb-6">
          Pantry&apos;s free tier still gets you a budget meal plan every week.
          You can upgrade any time from the pricing page.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-accent text-accent-fg rounded-md font-medium hover:opacity-90"
        >
          Back to Pantry
        </Link>
      </div>
    </div>
  )
}
