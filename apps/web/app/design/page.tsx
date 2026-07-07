import Link from "next/link"

import { designVariants } from "@/lib/design/variants"

export const metadata = {
  title: "Design · WBK",
  description: "Ten UI directions to choose from",
}

export default function DesignGalleryPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-8">
        <p className="text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase">
          WBK 2026
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Design gallery
        </h1>
        <p className="mt-1 max-w-lg text-sm text-neutral-400">
          Ten directions — same site view, minimal text. Click to compare.
        </p>
      </header>

      <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {designVariants.map((variant, index) => (
          <li key={variant.slug}>
            <Link
              href={`/design/${variant.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-colors hover:border-neutral-600"
            >
              <div
                className="flex h-28 flex-col justify-end p-4"
                style={{ background: variant.tokens.bg }}
              >
                <span
                  className="text-lg font-bold"
                  style={{
                    color: variant.tokens.text,
                    fontFamily: variant.fontDisplay,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="mt-1 h-1 w-8 rounded-full"
                  style={{ background: variant.tokens.accent }}
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-neutral-100">{variant.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {variant.taste}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
