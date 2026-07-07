import Link from "next/link"
import { notFound } from "next/navigation"

import { DesignPreview } from "@/components/design/design-preview"
import { designVariants, getDesignVariant } from "@/lib/design/variants"

export function generateStaticParams() {
  return designVariants.map((variant) => ({ slug: variant.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const variant = getDesignVariant(slug)
  if (!variant) {
    return { title: "Design" }
  }

  return {
    title: `${variant.name} · Design`,
    description: variant.tagline,
  }
}

export default async function DesignVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const variant = getDesignVariant(slug)
  const index = designVariants.findIndex((item) => item.slug === slug)

  if (!variant || index === -1) {
    notFound()
  }

  const prev = index > 0 ? designVariants[index - 1] : null
  const next = designVariants[(index + 1) % designVariants.length]!

  return (
    <div
      className="flex min-h-screen flex-col lg:flex-row"
      style={{ background: variant.tokens.bg }}
    >
      <aside className="flex flex-col justify-between border-b border-black/10 p-6 lg:w-80 lg:border-r lg:border-b-0 lg:border-black/10">
        <div>
          <p
            className="text-xs tracking-[0.2em] uppercase"
            style={{ color: variant.tokens.muted }}
          >
            {String(index + 1).padStart(2, "0")} / 10
          </p>
          <h1
            className="mt-2 text-2xl font-bold"
            style={{
              color: variant.tokens.text,
              fontFamily: variant.fontDisplay,
            }}
          >
            {variant.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: variant.tokens.muted }}>
            {variant.tagline}
          </p>
          <p
            className="mt-4 text-xs leading-relaxed"
            style={{ color: variant.tokens.muted }}
          >
            {variant.taste}
          </p>
          <p
            className="mt-6 text-xs"
            style={{
              color: variant.tokens.accent,
              fontFamily: variant.fontDisplay,
            }}
          >
            {variant.signature}
          </p>
        </div>

        <div className="mt-8 flex gap-2">
          {prev ? (
            <Link
              href={`/design/${prev.slug}`}
              className="rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                background: variant.tokens.surface,
                color: variant.tokens.text,
                border: `1px solid ${variant.tokens.border}`,
              }}
            >
              ← {prev.name}
            </Link>
          ) : null}
          <Link
            href={`/design/${next.slug}`}
            className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{
              background: variant.tokens.accent,
              color: variant.tokens.accentText,
            }}
          >
            {next.name} →
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
          <DesignPreview variant={variant} showMeta />
        </div>
      </main>
    </div>
  )
}
