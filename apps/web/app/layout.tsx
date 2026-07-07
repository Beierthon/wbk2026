import type { Metadata } from "next"
import { Archivo, Source_Sans_3 } from "next/font/google"

import "@workspace/ui/globals.css"
import { DesignThemeSwitcher } from "@/components/design/design-theme-switcher"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const fontSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeading = Archivo({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
})

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
      className={cn(
        "font-sans antialiased",
        fontSans.variable,
        fontHeading.variable
      )}
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
