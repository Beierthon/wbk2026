import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import "@workspace/ui/globals.css"
import { DesignThemeSwitcher } from "@/components/design/design-theme-switcher"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

export const metadata: Metadata = {
  title: "WBK 2026",
  description:
    "Einheitliche Plattform fuer Planung, Bauausfuehrung und Betrieb realer Bauprojekte.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistMono.variable, "font-sans antialiased")}
    >
      <body>
        <ThemeProvider>
          {children}
          <DesignThemeSwitcher />
        </ThemeProvider>
      </body>
    </html>
  )
}
