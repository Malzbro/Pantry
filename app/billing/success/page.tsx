import Link from "next/link"

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl text-ink mb-3">
          Thanks for subscribing!
        </h1>
        <p className="text-muted mb-6">
          You now have access to Pantry Premium. Your subscription is being activated
          and will be ready in a moment.
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
