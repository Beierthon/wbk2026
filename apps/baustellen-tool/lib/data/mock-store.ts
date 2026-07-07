import type {
  Aktivitaet,
  AktivitaetTyp,
  Arbeitsauftrag,
  AuftragErgebnis,
  AuftragStatus,
  Bauplan,
  Baustelle,
  BauteilPosition,
  Bauteilliste,
  Person,
  Rolle,
} from "@/lib/domain/schemas"

const SEED_TS = "2026-07-07T12:00:00.000Z"

type AuftragMitBezug = Arbeitsauftrag & {
  person_name: string | null
  position_name: string | null
  position_einheit: string | null
  position_sollmenge: number | null
  liste_titel: string | null
}

type MockStore = {
  baustellen: Baustelle[]
  personen: Person[]
  bauplaene: Bauplan[]
  listen: Bauteilliste[]
  positionen: BauteilPosition[]
  auftraege: Arbeitsauftrag[]
  ergebnisse: AuftragErgebnis[]
  aktivitaeten: Aktivitaet[]
}

const globalForBt = globalThis as unknown as {
  __btMockStore?: MockStore
}

function seedStore(): MockStore {
  const baustelleId = "10000000-0000-0000-0000-000000000001"
  const listeBestandId = "30000000-0000-0000-0000-000000000001"
  const listeFortschrittId = "30000000-0000-0000-0000-000000000002"

  return {
    baustellen: [
      {
        id: baustelleId,
        name: "Halle Nord 2026",
        adresse: "Industriestr. 8, 51063 Koeln",
        projektleitung: "Sabine Wegener",
        beschreibung:
          "Neubau Produktionshalle mit angrenzendem Lagerbereich. Rohbau Phase 2.",
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
    ],
    personen: [
      {
        id: "20000000-0000-0000-0000-000000000001",
        name: "Sabine Wegener",
        rolle: "buero",
        aktiv: true,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        name: "Thomas Klein",
        rolle: "bauleitung",
        aktiv: true,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "20000000-0000-0000-0000-000000000003",
        name: "Peter Schmidt",
        rolle: "shopfloor",
        aktiv: true,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "20000000-0000-0000-0000-000000000004",
        name: "Aylin Kaya",
        rolle: "shopfloor",
        aktiv: true,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "20000000-0000-0000-0000-000000000005",
        name: "Marek Nowak",
        rolle: "shopfloor",
        aktiv: true,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
    ],
    bauplaene: [],
    listen: [
      {
        id: listeBestandId,
        baustelle_id: baustelleId,
        titel: "Bestand Rohbau Halle Nord",
        typ: "bestand",
        beschreibung: "Bauteile-Bestand fuer die Rohbau-Phase.",
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: listeFortschrittId,
        baustelle_id: baustelleId,
        titel: "Fortschritt Rohbau",
        typ: "fortschritt",
        beschreibung: "Fortschritt pro Bauabschnitt.",
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
    ],
    positionen: [
      {
        id: "40000000-0000-0000-0000-000000000001",
        liste_id: listeBestandId,
        name: "Fensterrahmen 1,20 x 1,40 m",
        einheit: "stueck",
        sollmenge: 48,
        istmenge: 0,
        bauabschnitt: "Fassade Nord",
        beschreibung: "Aluminium, weiss, Waermeschutzverglasung",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "40000000-0000-0000-0000-000000000002",
        liste_id: listeBestandId,
        name: "Stahltraeger IPE 240",
        einheit: "stueck",
        sollmenge: 24,
        istmenge: 0,
        bauabschnitt: "Halle",
        beschreibung: "Laenge 6,0 m, RAL 7016",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "40000000-0000-0000-0000-000000000003",
        liste_id: listeBestandId,
        name: "Betonfertigteil-Stuetzen",
        einheit: "stueck",
        sollmenge: 16,
        istmenge: 0,
        bauabschnitt: "Halle",
        beschreibung: "B45, 40x40 cm, H 6,5 m",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "40000000-0000-0000-0000-000000000004",
        liste_id: listeBestandId,
        name: "Estrich Zementgebunden",
        einheit: "m2",
        sollmenge: 1200,
        istmenge: 0,
        bauabschnitt: "Halle EG",
        beschreibung: "CT-C25-F4, 8 cm",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "40000000-0000-0000-0000-000000000005",
        liste_id: listeFortschrittId,
        name: "Wand W-01 Fassade Nord",
        einheit: "prozent",
        sollmenge: 100,
        istmenge: 0,
        bauabschnitt: "Fassade Nord",
        beschreibung: "Mauerwerk KS 24 cm",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "40000000-0000-0000-0000-000000000006",
        liste_id: listeFortschrittId,
        name: "Decke D-01 EG",
        einheit: "prozent",
        sollmenge: 100,
        istmenge: 0,
        bauabschnitt: "Halle EG",
        beschreibung: "STB-Fertigteildecke inkl. Aufbeton",
        letztes_update_am: null,
        letztes_update_von_auftrag_id: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
    ],
    auftraege: [
      {
        id: "50000000-0000-0000-0000-000000000001",
        baustelle_id: baustelleId,
        typ: "bestand",
        titel: "Bestand Fensterrahmen im Lager Nord pruefen",
        beschreibung:
          "Bitte die gelieferten Fensterrahmen im Lager Nord zaehlen und melden.",
        zugewiesen_an: "20000000-0000-0000-0000-000000000003",
        bezug_liste_id: listeBestandId,
        bezug_position_id: "40000000-0000-0000-0000-000000000001",
        bezug_bauplan_id: null,
        status: "offen",
        erstellt_von: "Thomas Klein",
        abgeschlossen_am: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "50000000-0000-0000-0000-000000000002",
        baustelle_id: baustelleId,
        typ: "bestand",
        titel: "Bestand Stahltraeger pruefen",
        beschreibung: "Anzahl Stahltraeger IPE 240 auf dem Vorplatz pruefen.",
        zugewiesen_an: "20000000-0000-0000-0000-000000000004",
        bezug_liste_id: listeBestandId,
        bezug_position_id: "40000000-0000-0000-0000-000000000002",
        bezug_bauplan_id: null,
        status: "offen",
        erstellt_von: "Thomas Klein",
        abgeschlossen_am: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
      {
        id: "50000000-0000-0000-0000-000000000003",
        baustelle_id: baustelleId,
        typ: "fortschritt",
        titel: "Fortschritt Wand W-01 pruefen",
        beschreibung:
          "Foto von Wand W-01 Fassade Nord machen und Fortschritts-% schaetzen.",
        zugewiesen_an: "20000000-0000-0000-0000-000000000005",
        bezug_liste_id: listeFortschrittId,
        bezug_position_id: "40000000-0000-0000-0000-000000000005",
        bezug_bauplan_id: null,
        status: "offen",
        erstellt_von: "Thomas Klein",
        abgeschlossen_am: null,
        created_at: SEED_TS,
        updated_at: SEED_TS,
      },
    ],
    ergebnisse: [],
    aktivitaeten: [
      {
        id: "60000000-0000-0000-0000-000000000001",
        baustelle_id: baustelleId,
        typ: "auftrag_erstellt",
        titel: "Auftrag: Bestand Fensterrahmen pruefen",
        beschreibung: "Thomas Klein hat einen Auftrag an Peter Schmidt vergeben.",
        bezug_auftrag_id: "50000000-0000-0000-0000-000000000001",
        bezug_position_id: null,
        bezug_bauplan_id: null,
        payload: {},
        created_at: SEED_TS,
      },
      {
        id: "60000000-0000-0000-0000-000000000002",
        baustelle_id: baustelleId,
        typ: "auftrag_erstellt",
        titel: "Auftrag: Bestand Stahltraeger pruefen",
        beschreibung: "Thomas Klein hat einen Auftrag an Aylin Kaya vergeben.",
        bezug_auftrag_id: "50000000-0000-0000-0000-000000000002",
        bezug_position_id: null,
        bezug_bauplan_id: null,
        payload: {},
        created_at: SEED_TS,
      },
      {
        id: "60000000-0000-0000-0000-000000000003",
        baustelle_id: baustelleId,
        typ: "auftrag_erstellt",
        titel: "Auftrag: Fortschritt Wand W-01 pruefen",
        beschreibung: "Thomas Klein hat einen Auftrag an Marek Nowak vergeben.",
        bezug_auftrag_id: "50000000-0000-0000-0000-000000000003",
        bezug_position_id: null,
        bezug_bauplan_id: null,
        payload: {},
        created_at: SEED_TS,
      },
    ],
  }
}

export function getMockStore(): MockStore {
  if (!globalForBt.__btMockStore) {
    globalForBt.__btMockStore = structuredClone(seedStore())
  }
  return globalForBt.__btMockStore
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(): string {
  return crypto.randomUUID()
}

function mapAuftragMitBezug(auftrag: Arbeitsauftrag): AuftragMitBezug {
  const store = getMockStore()
  const person = auftrag.zugewiesen_an
    ? store.personen.find((p) => p.id === auftrag.zugewiesen_an)
    : null
  const position = auftrag.bezug_position_id
    ? store.positionen.find((p) => p.id === auftrag.bezug_position_id)
    : null
  const liste = auftrag.bezug_liste_id
    ? store.listen.find((l) => l.id === auftrag.bezug_liste_id)
    : null

  return {
    ...auftrag,
    person_name: person?.name ?? null,
    position_name: position?.name ?? null,
    position_einheit: position?.einheit ?? null,
    position_sollmenge: position?.sollmenge ?? null,
    liste_titel: liste?.titel ?? null,
  }
}

function insertAktivitaet(input: {
  baustelle_id: string
  typ: AktivitaetTyp
  titel: string
  beschreibung?: string
  bezug_auftrag_id?: string | null
  bezug_position_id?: string | null
  bezug_bauplan_id?: string | null
  payload?: Record<string, unknown>
}) {
  const store = getMockStore()
  store.aktivitaeten.unshift({
    id: newId(),
    baustelle_id: input.baustelle_id,
    typ: input.typ,
    titel: input.titel,
    beschreibung: input.beschreibung ?? "",
    bezug_auftrag_id: input.bezug_auftrag_id ?? null,
    bezug_position_id: input.bezug_position_id ?? null,
    bezug_bauplan_id: input.bezug_bauplan_id ?? null,
    payload: input.payload ?? {},
    created_at: nowIso(),
  })
}

export const mockData = {
  listBaustellen(): Baustelle[] {
    return [...getMockStore().baustellen].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    )
  },

  getBaustelle(id: string): Baustelle | null {
    return getMockStore().baustellen.find((b) => b.id === id) ?? null
  },

  createBaustelle(
    input: Pick<Baustelle, "name" | "adresse" | "projektleitung" | "beschreibung">,
  ): Baustelle {
    const ts = nowIso()
    const row: Baustelle = {
      id: newId(),
      ...input,
      created_at: ts,
      updated_at: ts,
    }
    getMockStore().baustellen.push(row)
    return row
  },

  deleteBaustelle(id: string) {
    const store = getMockStore()
    store.baustellen = store.baustellen.filter((b) => b.id !== id)
  },

  listPersonen(): Person[] {
    return getMockStore()
      .personen.filter((p) => p.aktiv)
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  listPersonenByRolle(rolle: Rolle): Person[] {
    return mockData.listPersonen().filter((p) => p.rolle === rolle)
  },

  getPerson(id: string): Person | null {
    return getMockStore().personen.find((p) => p.id === id) ?? null
  },

  createPerson(input: Pick<Person, "name" | "rolle" | "aktiv">): Person {
    const ts = nowIso()
    const row: Person = { id: newId(), ...input, created_at: ts, updated_at: ts }
    getMockStore().personen.push(row)
    return row
  },

  togglePersonAktiv(id: string, aktiv: boolean) {
    const person = getMockStore().personen.find((p) => p.id === id)
    if (!person) throw new Error("Person nicht gefunden")
    person.aktiv = aktiv
    person.updated_at = nowIso()
  },

  deletePerson(id: string) {
    const store = getMockStore()
    store.personen = store.personen.filter((p) => p.id !== id)
  },

  listBauplaene(baustelleId: string): Bauplan[] {
    return getMockStore()
      .bauplaene.filter((b) => b.baustelle_id === baustelleId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getBauplan(id: string): Bauplan | null {
    return getMockStore().bauplaene.find((b) => b.id === id) ?? null
  },

  createBauplan(
    input: Omit<Bauplan, "id" | "created_at" | "updated_at">,
  ): Bauplan {
    const ts = nowIso()
    const row: Bauplan = { id: newId(), ...input, created_at: ts, updated_at: ts }
    getMockStore().bauplaene.push(row)
    insertAktivitaet({
      baustelle_id: input.baustelle_id,
      typ: "bauplan_hochgeladen",
      titel: `Neuer Bauplan: ${input.titel}`,
      beschreibung: input.beschreibung,
      bezug_bauplan_id: row.id,
      payload: {
        dateityp: input.dateityp,
        version: input.version,
        hochgeladen_von: input.hochgeladen_von,
      },
    })
    return row
  },

  deleteBauplan(id: string) {
    const store = getMockStore()
    store.bauplaene = store.bauplaene.filter((b) => b.id !== id)
  },

  listBauteillisten(baustelleId: string): Bauteilliste[] {
    return getMockStore()
      .listen.filter((l) => l.baustelle_id === baustelleId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  },

  getBauteilliste(id: string): Bauteilliste | null {
    return getMockStore().listen.find((l) => l.id === id) ?? null
  },

  createBauteilliste(
    input: Pick<Bauteilliste, "baustelle_id" | "titel" | "typ" | "beschreibung">,
  ): Bauteilliste {
    const ts = nowIso()
    const row: Bauteilliste = { id: newId(), ...input, created_at: ts, updated_at: ts }
    getMockStore().listen.push(row)
    insertAktivitaet({
      baustelle_id: input.baustelle_id,
      typ: "liste_erstellt",
      titel: `Neue Liste: ${input.titel}`,
      beschreibung: input.beschreibung,
      payload: { liste_id: row.id, liste_typ: input.typ },
    })
    return row
  },

  updateBauteilliste(id: string, patch: Partial<Bauteilliste>) {
    const liste = getMockStore().listen.find((l) => l.id === id)
    if (!liste) throw new Error("Liste nicht gefunden")
    Object.assign(liste, patch, { updated_at: nowIso() })
  },

  deleteBauteilliste(id: string) {
    const store = getMockStore()
    store.listen = store.listen.filter((l) => l.id !== id)
    store.positionen = store.positionen.filter((p) => p.liste_id !== id)
  },

  listPositionen(listeId: string): BauteilPosition[] {
    return getMockStore()
      .positionen.filter((p) => p.liste_id === listeId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  },

  getPosition(id: string): BauteilPosition | null {
    return getMockStore().positionen.find((p) => p.id === id) ?? null
  },

  createPosition(
    input: Pick<
      BauteilPosition,
      | "liste_id"
      | "name"
      | "einheit"
      | "sollmenge"
      | "istmenge"
      | "bauabschnitt"
      | "beschreibung"
    >,
  ): BauteilPosition {
    const ts = nowIso()
    const row: BauteilPosition = {
      id: newId(),
      ...input,
      letztes_update_am: null,
      letztes_update_von_auftrag_id: null,
      created_at: ts,
      updated_at: ts,
    }
    getMockStore().positionen.push(row)
    return row
  },

  updatePosition(id: string, patch: Partial<BauteilPosition>) {
    const position = getMockStore().positionen.find((p) => p.id === id)
    if (!position) throw new Error("Position nicht gefunden")
    Object.assign(position, patch, { updated_at: nowIso() })
  },

  deletePosition(id: string) {
    const store = getMockStore()
    store.positionen = store.positionen.filter((p) => p.id !== id)
  },

  listAuftraege(baustelleId: string): AuftragMitBezug[] {
    return getMockStore()
      .auftraege.filter((a) => a.baustelle_id === baustelleId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(mapAuftragMitBezug)
  },

  listAuftraegeFuerPerson(personId: string): AuftragMitBezug[] {
    return getMockStore()
      .auftraege.filter(
        (a) =>
          a.zugewiesen_an === personId &&
          (a.status === "offen" || a.status === "in_arbeit"),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(mapAuftragMitBezug)
  },

  getAuftrag(id: string): AuftragMitBezug | null {
    const auftrag = getMockStore().auftraege.find((a) => a.id === id)
    return auftrag ? mapAuftragMitBezug(auftrag) : null
  },

  listErgebnisse(auftragId: string): AuftragErgebnis[] {
    return getMockStore()
      .ergebnisse.filter((e) => e.auftrag_id === auftragId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  countAuftraegeByStatus(baustelleId: string): Record<AuftragStatus, number> {
    const counts: Record<AuftragStatus, number> = {
      offen: 0,
      in_arbeit: 0,
      abgeschlossen: 0,
      abgebrochen: 0,
    }
    for (const auftrag of getMockStore().auftraege) {
      if (auftrag.baustelle_id !== baustelleId) continue
      counts[auftrag.status] += 1
    }
    return counts
  },

  createArbeitsauftrag(
    input: Omit<Arbeitsauftrag, "id" | "status" | "abgeschlossen_am" | "created_at" | "updated_at">,
  ): Arbeitsauftrag {
    const ts = nowIso()
    const row: Arbeitsauftrag = {
      id: newId(),
      ...input,
      status: "offen",
      abgeschlossen_am: null,
      created_at: ts,
      updated_at: ts,
    }
    getMockStore().auftraege.unshift(row)
    insertAktivitaet({
      baustelle_id: input.baustelle_id,
      typ: "auftrag_erstellt",
      titel: `Neuer Auftrag: ${input.titel}`,
      beschreibung: input.beschreibung,
      bezug_auftrag_id: row.id,
      bezug_position_id: input.bezug_position_id ?? null,
      payload: {
        typ: input.typ,
        zugewiesen_an: input.zugewiesen_an ?? null,
        erstellt_von: input.erstellt_von,
      },
    })
    return row
  },

  updateAuftragStatus(id: string, status: AuftragStatus) {
    const auftrag = getMockStore().auftraege.find((a) => a.id === id)
    if (!auftrag) throw new Error("Auftrag nicht gefunden")
    auftrag.status = status
    auftrag.updated_at = nowIso()
    auftrag.abgeschlossen_am =
      status === "abgeschlossen" || status === "abgebrochen" ? nowIso() : null

    insertAktivitaet({
      baustelle_id: auftrag.baustelle_id,
      typ: statusZuAktivitaetTyp(status),
      titel: `Auftrag ${statusLabel(status)}: ${auftrag.titel}`,
      beschreibung: "",
      bezug_auftrag_id: id,
      payload: { status },
    })
  },

  deleteArbeitsauftrag(id: string) {
    const store = getMockStore()
    store.auftraege = store.auftraege.filter((a) => a.id !== id)
    store.ergebnisse = store.ergebnisse.filter((e) => e.auftrag_id !== id)
  },

  listAktivitaeten(baustelleId: string, limit = 50): Aktivitaet[] {
    return getMockStore()
      .aktivitaeten.filter((a) => a.baustelle_id === baustelleId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
  },

  erledigeAuftrag(
    auftragId: string,
    input: {
      bestaetigte_menge: number
      notiz: string
      ai_estimate?: number | null
      ai_confidence?: number | null
      ai_interpretation: string
      ai_raw?: unknown
      foto_pfad?: string | null
      erstellt_von: string
    },
  ): { ergebnis_id: string } {
    const auftrag = getMockStore().auftraege.find((a) => a.id === auftragId)
    if (!auftrag) throw new Error("Auftrag nicht gefunden")

    const ts = nowIso()
    const ergebnis: AuftragErgebnis = {
      id: newId(),
      auftrag_id: auftragId,
      foto_pfad: input.foto_pfad ?? null,
      ai_estimate: input.ai_estimate ?? null,
      ai_confidence: input.ai_confidence ?? null,
      ai_interpretation: input.ai_interpretation,
      ai_raw: input.ai_raw ?? {},
      bestaetigte_menge: input.bestaetigte_menge,
      notiz: input.notiz,
      final: true,
      erstellt_von: input.erstellt_von,
      created_at: ts,
      updated_at: ts,
    }
    getMockStore().ergebnisse.unshift(ergebnis)

    if (auftrag.bezug_position_id) {
      const position = getMockStore().positionen.find(
        (p) => p.id === auftrag.bezug_position_id,
      )
      if (position) {
        position.istmenge = input.bestaetigte_menge
        position.letztes_update_am = ts
        position.letztes_update_von_auftrag_id = auftragId
        position.updated_at = ts
      }
    }

    auftrag.status = "abgeschlossen"
    auftrag.abgeschlossen_am = ts
    auftrag.updated_at = ts

    insertAktivitaet({
      baustelle_id: auftrag.baustelle_id,
      typ: "auftrag_abgeschlossen",
      titel: `Auftrag abgeschlossen: ${auftrag.titel}`,
      beschreibung: `Bestätigt: ${input.bestaetigte_menge}${
        input.ai_estimate != null ? ` (AI-Schätzung: ${input.ai_estimate})` : ""
      }`,
      bezug_auftrag_id: auftragId,
      bezug_position_id: auftrag.bezug_position_id ?? null,
      payload: {
        bestaetigte_menge: input.bestaetigte_menge,
        ai_estimate: input.ai_estimate ?? null,
        ai_confidence: input.ai_confidence ?? null,
        erstellt_von: input.erstellt_von,
      },
    })

    return { ergebnis_id: ergebnis.id }
  },
}

function statusZuAktivitaetTyp(status: AuftragStatus): AktivitaetTyp {
  switch (status) {
    case "in_arbeit":
      return "auftrag_in_arbeit"
    case "abgeschlossen":
      return "auftrag_abgeschlossen"
    case "abgebrochen":
      return "auftrag_abgebrochen"
    default:
      return "auftrag_erstellt"
  }
}

function statusLabel(status: AuftragStatus): string {
  switch (status) {
    case "in_arbeit":
      return "in Arbeit"
    case "abgeschlossen":
      return "abgeschlossen"
    case "abgebrochen":
      return "abgebrochen"
    case "offen":
      return "wieder offen"
  }
}
