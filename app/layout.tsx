import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeScript } from "@/components/ThemeScript"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { InstallPrompt } from "@/components/InstallPrompt"
import { PushPrompt } from "@/components/PushPrompt"
import { CookieConsent } from "@/components/CookieConsent"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

// Fraunces uses an optical size axis (opsz) — next/font/google doesn't support
// the opsz axis via the standard API, so we load it as a variable font from Google
// using localFont with a Google Fonts CSS URL workaround. However the simplest
// approach that works: use next/font/google with the axes param.
import { Fraunces } from "next/font/google"
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pantry — Plan your week",
  description:
    "Plan a week of UK meals for the budget you choose. Pantry tells you what to cook, what to buy, and how much you saved.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Pantry — Plan your week",
    description:
      "Plan a week of UK meals for the budget you choose. Pantry tells you what to cook, what to buy, and how much you saved.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pantry — Plan your week",
    description:
      "Plan a week of UK meals for the budget you choose. Pantry tells you what to cook, what to buy, and how much you saved.",
  },
  icons: {
    icon: "/leaf.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B2737",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans">
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <PushPrompt />
        <CookieConsent />
      </body>
    </html>
  )
}
