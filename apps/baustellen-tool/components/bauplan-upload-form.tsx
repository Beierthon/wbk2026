"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { UploadIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import { createBauplan } from "@/app/actions/bauplaene"
import { createClient } from "@/lib/supabase/client"

const EXT_TO_TYP: Record<string, "pdf" | "png" | "jpg" | "jpeg" | "webp" | "dwg" | "dxf"> = {
  pdf: "pdf",
  png: "png",
  jpg: "jpg",
  jpeg: "jpeg",
  webp: "webp",
  dwg: "dwg",
  dxf: "dxf",
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export function BauplanUploadForm({ baustelleId }: { baustelleId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  async function submit(formData: FormData) {
    if (!selectedFile) {
      toast.error("Bitte eine Datei auswählen.")
      return
    }
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() ?? ""
    const typ = EXT_TO_TYP[ext]
    if (!typ) {
      toast.error(`Dateityp .${ext} wird nicht unterstützt.`)
      return
    }

    const supabase = createClient()
    const pfad = `${baustelleId}/${Date.now()}-${sanitize(selectedFile.name)}`

    const { error: uploadErr } = await supabase.storage
      .from("bt_bauplaene")
      .upload(pfad, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      })
    if (uploadErr) {
      toast.error(`Upload fehlgeschlagen: ${uploadErr.message}`)
      return
    }

    try {
      await createBauplan({
        baustelle_id: baustelleId,
        titel: String(formData.get("titel") ?? selectedFile.name),
        beschreibung: String(formData.get("beschreibung") ?? ""),
        datei_pfad: pfad,
        dateityp: typ,
        version: Number(formData.get("version") ?? 1),
        hochgeladen_von: String(formData.get("hochgeladen_von") ?? "Büro"),
      })
      toast.success("Bauplan hochgeladen.")
      setOpen(false)
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ""
    } catch (e) {
      await supabase.storage.from("bt_bauplaene").remove([pfad])
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UploadIcon /> Bauplan
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={(fd) => startTransition(() => submit(fd))} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Bauplan hochladen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="datei">Datei</Label>
              <Input
                id="datei"
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf"
                onChange={handleFile}
                required
              />
              {selectedFile && (
                <div className="text-xs text-muted-foreground">
                  {selectedFile.name} · {Math.round(selectedFile.size / 1024)} KB
                </div>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="titel">Titel</Label>
              <Input
                id="titel"
                name="titel"
                required
                defaultValue={selectedFile?.name.replace(/\.[^.]+$/, "") ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="hochgeladen_von">Hochgeladen von</Label>
                <Input
                  id="hochgeladen_von"
                  name="hochgeladen_von"
                  defaultValue="Büro"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea id="beschreibung" name="beschreibung" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !selectedFile}>
              {pending ? "Wird hochgeladen…" : "Hochladen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
