"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CameraIcon,
  CheckCircle2Icon,
  ImageIcon,
  Loader2Icon,
  RefreshCcwIcon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import type { AnalyzeResponse } from "@/lib/vision/types"
import type { AuftragTyp, Einheit } from "@/lib/domain/schemas"
import { EINHEIT_LABELS } from "@/lib/domain/schemas"

interface ExpectedItem {
  name: string
  einheit: Einheit
  sollmenge?: number | null
  beschreibung?: string
  bauabschnitt?: string
}

interface Props {
  auftragId: string
  personName: string
  typ: AuftragTyp
  expectedItem: ExpectedItem | null
  onDone?: () => void
}

type Phase =
  | "idle"
  | "capturing"
  | "captured"
  | "analyzing"
  | "analyzed"
  | "submitting"
  | "done"

const DEMO_IMAGE =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#374151"/><text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">Demo-Aufnahme</text></svg>',
  )

export function KameraFlow({
  auftragId,
  personName,
  typ,
  expectedItem,
  onDone,
}: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [ai, setAi] = useState<AnalyzeResponse | null>(null)
  const [confirmedValue, setConfirmedValue] = useState<string>("")
  const [notiz, setNotiz] = useState<string>("")
  const [visionMode, setVisionMode] = useState<"mock" | "openai" | undefined>(
    undefined,
  )

  async function startCamera() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Kamera nicht verfügbar. Nutze den Demo-Scan.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase("capturing")
    } catch (e) {
      setError(
        e instanceof Error
          ? `Kamera nicht startbar: ${e.message}`
          : "Kamera nicht startbar.",
      )
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function captureFrame() {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setError("Video ist noch nicht bereit.")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    setPhase("captured")
  }

  function useDemoScan() {
    setCapturedImage(DEMO_IMAGE)
    setVisionMode("mock")
    setPhase("captured")
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImage(String(reader.result))
      setPhase("captured")
    }
    reader.readAsDataURL(file)
  }

  function resetCapture() {
    setCapturedImage(null)
    setAi(null)
    setConfirmedValue("")
    setNotiz("")
    setError(null)
    setPhase("idle")
    setVisionMode(undefined)
  }

  async function runAnalyze() {
    if (!capturedImage || !expectedItem) return
    setPhase("analyzing")
    setError(null)
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          mode: typ === "freitext" ? "bestand" : typ,
          expectedItem: {
            name: expectedItem.name,
            einheit: expectedItem.einheit,
            sollmenge: expectedItem.sollmenge ?? undefined,
            beschreibung: expectedItem.beschreibung,
            bauabschnitt: expectedItem.bauabschnitt,
          },
          visionMode,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as AnalyzeResponse
      setAi(data)
      setConfirmedValue(String(data.estimate))
      setPhase("analyzed")
    } catch (e) {
      setPhase("captured")
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen.")
    }
  }

  async function submitConfirmation() {
    if (!ai) return
    setPhase("submitting")
    setError(null)
    try {
      const menge = Number(confirmedValue)
      if (Number.isNaN(menge)) throw new Error("Bitte eine Zahl eintragen.")
      const res = await fetch(`/api/auftraege/${auftragId}/erledigen`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bestaetigte_menge: menge,
          notiz,
          ai_estimate: ai.estimate,
          ai_confidence: ai.confidence,
          ai_interpretation: ai.interpretation,
          ai_raw: ai.raw ?? { source: ai.mode },
          erstellt_von: personName,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      toast.success("Ergebnis übernommen. Bauteilliste wurde aktualisiert.")
      setPhase("done")
      onDone?.()
      router.refresh()
    } catch (e) {
      setPhase("analyzed")
      setError(e instanceof Error ? e.message : "Übermittlung fehlgeschlagen.")
    }
  }

  if (!expectedItem && typ !== "freitext") {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Dieser Auftrag hat keinen Positionsbezug — er kann in dieser Version nur
        über den Bauleitung-Bereich abgeschlossen werden.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {phase === "idle" && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="text-sm font-medium">Aufnahme starten</div>
            <div className="text-xs text-muted-foreground">
              Kamera nutzt die Rückkamera deines Geräts. Alternativ Demo-Scan oder
              Bild-Upload verwenden.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button onClick={startCamera} className="w-full">
                <CameraIcon /> Kamera starten
              </Button>
              <Button onClick={useDemoScan} variant="outline" className="w-full">
                <ImageIcon /> Demo-Scan
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                <UploadIcon className="h-4 w-4" /> Foto hochladen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {phase === "capturing" && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={captureFrame} className="flex-1">
              <CameraIcon /> Foto machen
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                stopCamera()
                setPhase("idle")
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {(phase === "captured" || phase === "analyzing" || phase === "analyzed" || phase === "submitting") &&
        capturedImage && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Aufnahme"
                className="aspect-video w-full object-contain"
              />
              {ai?.boundingBoxes?.map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-sm border-2 border-emerald-400/80 bg-emerald-400/10"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 rounded bg-emerald-400/90 px-1 text-[10px] font-medium text-white">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            {phase === "captured" && (
              <div className="flex gap-2">
                <Button onClick={runAnalyze} className="flex-1">
                  <CameraIcon /> Auswerten
                </Button>
                <Button variant="outline" onClick={resetCapture}>
                  <RefreshCcwIcon /> Neu
                </Button>
              </div>
            )}

            {phase === "analyzing" && (
              <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                AI wertet das Bild aus …
              </div>
            )}

            {(phase === "analyzed" || phase === "submitting") && ai && (
              <div className="space-y-3 rounded-lg border bg-card p-4">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    AI-Schätzung
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-semibold">{ai.estimate}</div>
                    <div className="text-sm text-muted-foreground">
                      {EINHEIT_LABELS[ai.einheit as Einheit] ?? ai.einheit}
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      Confidence {Math.round(ai.confidence * 100)}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ai.interpretation}
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bestaetigt">Bestätigter Wert</Label>
                  <Input
                    id="bestaetigt"
                    type="number"
                    step="any"
                    min="0"
                    value={confirmedValue}
                    onChange={(e) => setConfirmedValue(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="notiz">Notiz (optional)</Label>
                  <Textarea
                    id="notiz"
                    rows={2}
                    value={notiz}
                    onChange={(e) => setNotiz(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={submitConfirmation}
                    disabled={phase === "submitting"}
                    className="flex-1"
                  >
                    {phase === "submitting" ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />{" "}
                        Übertragen …
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon /> Bestätigen
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetCapture}>
                    Neu
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
          Ergebnis übernommen. Bauteilliste ist aktualisiert.
        </div>
      )}
    </div>
  )
}
