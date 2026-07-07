import Link from "next/link"

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="fixed left-4 top-4 z-50 flex gap-2">
        <Link
          href="/design"
          className="rounded-full border border-neutral-700 bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-neutral-200 backdrop-blur hover:bg-neutral-800"
        >
          ← Alle
        </Link>
      </div>
      {children}
    </div>
  )
}
