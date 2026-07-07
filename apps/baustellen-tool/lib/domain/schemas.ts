import { z } from "zod"

export const EINHEITEN = ["stueck", "m", "m2", "m3", "kg", "t", "prozent"] as const
export type Einheit = (typeof EINHEITEN)[number]

export const ROLLEN = ["buero", "bauleitung", "shopfloor"] as const
export type Rolle = (typeof ROLLEN)[number]

export const AUFTRAG_TYPEN = ["bestand", "fortschritt", "freitext"] as const
export type AuftragTyp = (typeof AUFTRAG_TYPEN)[number]

export const AUFTRAG_STATUS = ["offen", "in_arbeit", "abgeschlossen", "abgebrochen"] as const
export type AuftragStatus = (typeof AUFTRAG_STATUS)[number]

export const LISTEN_TYPEN = ["bestand", "fortschritt"] as const
export type ListenTyp = (typeof LISTEN_TYPEN)[number]

export const AKTIVITAET_TYPEN = [
  "auftrag_erstellt",
  "auftrag_in_arbeit",
  "auftrag_abgeschlossen",
  "auftrag_abgebrochen",
  "bauplan_hochgeladen",
  "position_aktualisiert",
  "liste_erstellt",
] as const
export type AktivitaetTyp = (typeof AKTIVITAET_TYPEN)[number]

export const BauplanDateityp = ["pdf", "png", "jpg", "jpeg", "webp", "dwg", "dxf"] as const

export const BaustelleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  adresse: z.string(),
  projektleitung: z.string(),
  beschreibung: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Baustelle = z.infer<typeof BaustelleSchema>

export const PersonSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rolle: z.enum(ROLLEN),
  aktiv: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Person = z.infer<typeof PersonSchema>

export const BauplanSchema = z.object({
  id: z.string().uuid(),
  baustelle_id: z.string().uuid(),
  titel: z.string(),
  beschreibung: z.string(),
  datei_pfad: z.string(),
  dateityp: z.enum(BauplanDateityp),
  version: z.number().int().positive(),
  hochgeladen_von: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Bauplan = z.infer<typeof BauplanSchema>

export const BauteillisteSchema = z.object({
  id: z.string().uuid(),
  baustelle_id: z.string().uuid(),
  titel: z.string(),
  typ: z.enum(LISTEN_TYPEN),
  beschreibung: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Bauteilliste = z.infer<typeof BauteillisteSchema>

export const BauteilPositionSchema = z.object({
  id: z.string().uuid(),
  liste_id: z.string().uuid(),
  name: z.string(),
  einheit: z.enum(EINHEITEN),
  sollmenge: z.number(),
  istmenge: z.number(),
  bauabschnitt: z.string(),
  beschreibung: z.string(),
  letztes_update_am: z.string().nullable(),
  letztes_update_von_auftrag_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type BauteilPosition = z.infer<typeof BauteilPositionSchema>

export const ArbeitsauftragSchema = z.object({
  id: z.string().uuid(),
  baustelle_id: z.string().uuid(),
  typ: z.enum(AUFTRAG_TYPEN),
  titel: z.string(),
  beschreibung: z.string(),
  zugewiesen_an: z.string().uuid().nullable(),
  bezug_liste_id: z.string().uuid().nullable(),
  bezug_position_id: z.string().uuid().nullable(),
  bezug_bauplan_id: z.string().uuid().nullable(),
  status: z.enum(AUFTRAG_STATUS),
  erstellt_von: z.string(),
  abgeschlossen_am: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Arbeitsauftrag = z.infer<typeof ArbeitsauftragSchema>

export const AuftragErgebnisSchema = z.object({
  id: z.string().uuid(),
  auftrag_id: z.string().uuid(),
  foto_pfad: z.string().nullable(),
  ai_estimate: z.number().nullable(),
  ai_confidence: z.number().nullable(),
  ai_interpretation: z.string(),
  ai_raw: z.unknown(),
  bestaetigte_menge: z.number().nullable(),
  notiz: z.string(),
  final: z.boolean(),
  erstellt_von: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type AuftragErgebnis = z.infer<typeof AuftragErgebnisSchema>

export const AktivitaetSchema = z.object({
  id: z.string().uuid(),
  baustelle_id: z.string().uuid(),
  typ: z.enum(AKTIVITAET_TYPEN),
  titel: z.string(),
  beschreibung: z.string(),
  bezug_auftrag_id: z.string().uuid().nullable(),
  bezug_position_id: z.string().uuid().nullable(),
  bezug_bauplan_id: z.string().uuid().nullable(),
  payload: z.record(z.unknown()),
  created_at: z.string(),
})
export type Aktivitaet = z.infer<typeof AktivitaetSchema>

export const EINHEIT_LABELS: Record<Einheit, string> = {
  stueck: "Stück",
  m: "m",
  m2: "m²",
  m3: "m³",
  kg: "kg",
  t: "t",
  prozent: "%",
}

export const ROLLEN_LABELS: Record<Rolle, string> = {
  buero: "Büro",
  bauleitung: "Bauleitung",
  shopfloor: "Shopfloor",
}

export const AUFTRAG_STATUS_LABELS: Record<AuftragStatus, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
}

export const AUFTRAG_TYP_LABELS: Record<AuftragTyp, string> = {
  bestand: "Bestandsprüfung",
  fortschritt: "Fortschrittsprüfung",
  freitext: "Freitext-Kontrolle",
}
