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
          Demo & geführte Touren
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          WBK 2026 verbindet Planung, Bau und Betrieb in einem Projektkontext.
          Wähle ein Szenario – die Tour führt Schritt für Schritt durch die
          passenden Ansichten. Alles läuft im Demo-/Mock-Modus ohne Backend oder
          Zugangsdaten.
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
                    Tour starten
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
