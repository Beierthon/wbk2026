import Link from "next/link"

import { DEMO_SZENARIEN } from "@/lib/demo/szenarien"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function DemoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Demo & guided tours
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          WBK 2026 connects planning, construction, and operations in one
          project context. Pick a scenario — the tour walks you step by step
          through the relevant views. Everything runs in demo/mock mode without
          a backend or credentials.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_SZENARIEN.map((szenario) => {
          const start = szenario.schritte[0]
          return (
            <Card key={szenario.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{szenario.titel}</CardTitle>
                  <Badge variant="outline">{szenario.dauer}</Badge>
                </div>
                <CardDescription>{szenario.kurz}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {szenario.schritte.map((schritt, index) => (
                    <li key={schritt.titel}>
                      {index + 1}. {schritt.titel}
                    </li>
                  ))}
                </ol>
                {start ? (
                  <Button
                    className="w-fit"
                    render={
                      <Link
                        href={`${start.href}?tour=${szenario.id}&schritt=0`}
                      />
                    }
                  >
                    Start tour
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
