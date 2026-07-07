import { formatEuroFromCent } from "@/components/dashboard/formatters"
import {
  berechneKritischerPfad,
  erkennePlanungskonflikte,
  kumulierteVerschiebungTage,
} from "@workspace/domain/terminplan"
import { RepositoryError } from "./errors"
import type {
  AktivitaetsUebersicht,
  AnalyticsUebersicht,
  AssetMitKontext,
  BauUebersicht,
  BetriebUebersicht,
  KostenprognoseMitKontext,
  KostenprognosenUebersicht,
  MaterialWithBestellung,
  PlanstandMitVersionen,
  PlanungsUebersicht,
  ProjectDashboardData,
  RoadmapUebersicht,
  StandortUebersicht,
} from "./types"

export function buildBauUebersicht(data: ProjectDashboardData): BauUebersicht {
  const materialien: MaterialWithBestellung[] = data.materialien.map((material) => {
    const bestellung = data.bestellungen.find(
      (item) => item.materialId === material.id
    )
    const externeReferenz = bestellung?.externeReferenzId
      ? data.externeReferenzen.find((item) => item.id === bestellung.externeReferenzId)
      : undefined

    return { material, bestellung, externeReferenz }
  })

  return {
    projekt: data.projekt,
    standort: data.standort,
    materialien,
    konflikte: data.konflikte.filter(
      (konflikt) =>
        konflikt.quelle === "bau" || konflikt.zielDomaene === "planung"
    ),
    kommentare: data.kommentare.filter((kommentar) => kommentar.rolle === "bau"),
    aktivitaeten: data.aktivitaeten.filter(
      (aktivitaet) =>
        aktivitaet.quelle === "bau" ||
        aktivitaet.ziel === "bau" ||
        aktivitaet.art === "konflikt_gemeldet" ||
        aktivitaet.art === "erp_eap_sync"
    ),
    externeReferenzen: data.externeReferenzen,
  }
}

export function buildPlanungsUebersicht(
  data: ProjectDashboardData
): PlanungsUebersicht {
  const planstaende: PlanstandMitVersionen[] = data.planstaende.map((planstand) => {
    const versionen = data.planversionen.filter(
      (version) => version.planstandId === planstand.id
    )
    const aktuelleVersion = versionen.find(
      (version) => version.id === planstand.aktuelleVersionId
    )

    if (!aktuelleVersion) {
      throw new RepositoryError(
        `Aktuelle Planversion fuer ${planstand.id} nicht gefunden.`,
        500
      )
    }

    return {
      ...planstand,
      versionen,
      aktuelleVersion,
    }
  })

  return {
    projekt: data.projekt,
    standort: data.standort,
    planstaende,
    planMarker: data.planMarker,
    konflikte: data.konflikte.filter(
      (konflikt) =>
        konflikt.quelle === "planung" || konflikt.zielDomaene === "planung"
    ),
    kommentare: data.kommentare.filter(
      (kommentar) => kommentar.rolle === "planung"
    ),
    entscheidungen: data.entscheidungen,
  }
}

export function buildBetriebUebersicht(
  data: ProjectDashboardData
): BetriebUebersicht {
  const materialById = new Map(
    data.materialien.map((material) => [material.id, material])
  )
  const planversionById = new Map(
    data.planversionen.map((planversion) => [planversion.id, planversion])
  )
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )
  const entscheidungById = new Map(
    data.entscheidungen.map((entscheidung) => [entscheidung.id, entscheidung])
  )
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]))
  const bestellungByMaterialId = new Map(
    data.bestellungen.map((bestellung) => [bestellung.materialId, bestellung])
  )
  const externeReferenzById = new Map(
    data.externeReferenzen.map((referenz) => [referenz.id, referenz])
  )

  const assetEntscheidungByAssetId = new Map<string, string>()
  for (const aktivitaet of data.aktivitaeten) {
    if (aktivitaet.bezug.assetId && aktivitaet.bezug.entscheidungId) {
      assetEntscheidungByAssetId.set(
        aktivitaet.bezug.assetId,
        aktivitaet.bezug.entscheidungId
      )
    }
  }

  const wartungsaufgabenByAssetId = new Map<string, typeof data.wartungsaufgaben>()
  for (const wartung of data.wartungsaufgaben) {
    const existing = wartungsaufgabenByAssetId.get(wartung.assetId) ?? []
    existing.push(wartung)
    wartungsaufgabenByAssetId.set(wartung.assetId, existing)
  }

  const wartungsaufgaben: BetriebUebersicht["wartungsaufgaben"] =
    data.wartungsaufgaben.map((wartung) => ({
      ...wartung,
      assetName: assetById.get(wartung.assetId)?.name,
    }))

  const kostenprognosen: KostenprognoseMitKontext[] = data.kostenprognosen
    .map((prognose) => ({
      ...prognose,
      konfliktTitel: prognose.konfliktId
        ? konfliktById.get(prognose.konfliktId)?.titel
        : undefined,
    }))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  const assets: AssetMitKontext[] = data.assets.map((asset) => {
    const material = asset.materialId
      ? materialById.get(asset.materialId)
      : undefined
    const planversion = asset.planversionId
      ? planversionById.get(asset.planversionId)
      : undefined
    const entscheidungId = assetEntscheidungByAssetId.get(asset.id)
    const entscheidung = entscheidungId
      ? entscheidungById.get(entscheidungId)
      : undefined
    const konflikt = entscheidung?.konfliktId
      ? konfliktById.get(entscheidung.konfliktId)
      : undefined
    const kostenprognose = entscheidung?.konfliktId
      ? data.kostenprognosen.find(
          (prognose) => prognose.konfliktId === entscheidung.konfliktId
        )
      : undefined
    const bestellung = asset.materialId
      ? bestellungByMaterialId.get(asset.materialId)
      : undefined
    const erpReferenz = bestellung?.externeReferenzId
      ? externeReferenzById.get(bestellung.externeReferenzId)
      : undefined
    const assetWartungen = wartungsaufgabenByAssetId.get(asset.id) ?? []

    return {
      ...asset,
      materialName: material?.name,
      planversionLabel: planversion?.version,
      konfliktTitel: konflikt?.titel,
      entscheidungTitel: entscheidung?.titel,
      betriebMehrkostenCent: kostenprognose?.betriebMehrkostenCent,
      herkunftQuellen: {
        plan: planversion
          ? `${planversion.version} (${planversion.aenderungsnotiz})`
          : undefined,
        bau: konflikt?.titel ?? asset.herkunft,
        erp: erpReferenz
          ? `${erpReferenz.systemName} ${erpReferenz.externerSchluessel}`
          : undefined,
      },
      wartungsaufgaben: assetWartungen.map((wartung) => ({
        ...wartung,
        assetName: asset.name,
      })),
    }
  })

  const aktivitaeten = data.aktivitaeten
    .filter(
      (aktivitaet) =>
        aktivitaet.quelle === "betrieb" ||
        aktivitaet.ziel === "betrieb" ||
        aktivitaet.art === "asset_uebergeben"
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  const planversionIds = new Set(
    assets
      .map((asset) => asset.planversionId)
      .filter((id): id is string => Boolean(id))
  )

  const planversionen = data.planversionen.filter((planversion) =>
    planversionIds.has(planversion.id)
  )

  const uebergabeCheckliste: BetriebUebersicht["uebergabeCheckliste"] = []

  for (const planversion of planversionen) {
    uebergabeCheckliste.push({
      id: `check-plan-${planversion.id}`,
      titel: `Planversion ${planversion.version} in Betreiberakte`,
      beschreibung: planversion.aenderungsnotiz,
      status:
        planversion.status === "freigegeben"
          ? "erledigt"
          : planversion.status === "zur_pruefung"
            ? "in_pruefung"
            : "offen",
      planversionId: planversion.id,
      planversionLabel: planversion.version,
    })
  }

  for (const entscheidung of data.entscheidungen) {
    const konflikt = entscheidung.konfliktId
      ? konfliktById.get(entscheidung.konfliktId)
      : undefined
    const planversion = konflikt?.planversionId
      ? planversionById.get(konflikt.planversionId)
      : undefined
    const asset = assets.find(
      (item) => item.entscheidungTitel === entscheidung.titel
    )

    uebergabeCheckliste.push({
      id: `check-entscheidung-${entscheidung.id}`,
      titel: `Entscheidung dokumentiert: ${entscheidung.titel}`,
      beschreibung: entscheidung.begruendung,
      status:
        entscheidung.status === "freigegeben"
          ? "erledigt"
          : entscheidung.status === "vorgeschlagen"
            ? "in_pruefung"
            : "offen",
      planversionId: asset?.planversionId ?? planversion?.id,
      planversionLabel: asset?.planversionLabel ?? planversion?.version,
      entscheidungId: entscheidung.id,
      entscheidungTitel: entscheidung.titel,
      assetId: asset?.id,
    })
  }

  for (const asset of assets) {
    for (const [index, punkt] of asset.offenePunkte.entries()) {
      uebergabeCheckliste.push({
        id: `check-asset-${asset.id}-${index}`,
        titel: punkt,
        beschreibung: `Offener Uebergabepunkt fuer ${asset.name}`,
        status: "offen",
        assetId: asset.id,
        planversionId: asset.planversionId,
        planversionLabel: asset.planversionLabel,
        entscheidungId: assetEntscheidungByAssetId.get(asset.id),
        entscheidungTitel: asset.entscheidungTitel,
      })
    }
  }

  const betriebskostenHinweise: BetriebUebersicht["betriebskostenHinweise"] =
    data.entscheidungen.flatMap((entscheidung) => {
      const konflikt = entscheidung.konfliktId
        ? konfliktById.get(entscheidung.konfliktId)
        : undefined
      const prognose = entscheidung.konfliktId
        ? data.kostenprognosen.find(
            (item) => item.konfliktId === entscheidung.konfliktId
          )
        : undefined

      if (!prognose && entscheidung.folgenFuerBetrieb.length === 0) {
        return []
      }

      return [
        {
          entscheidungTitel: entscheidung.titel,
          konfliktTitel: konflikt?.titel,
          betriebMehrkostenCent: prognose?.betriebMehrkostenCent ?? 0,
          wartungsHinweis:
            entscheidung.folgenFuerBetrieb.find((folge) =>
              folge.toLowerCase().includes("wartung")
            ) ?? entscheidung.folgenFuerBetrieb[0],
        },
      ]
    })

  const uebergabedokumente = data.dateien.filter(
    (datei) =>
      datei.bucket === "uebergabeberichte" ||
      datei.quelle === "betrieb" ||
      Boolean(datei.assetId)
  )

  return {
    projekt: data.projekt,
    standort: data.standort,
    assets,
    entscheidungen: data.entscheidungen,
    aktivitaeten,
    planversionen,
    materialien: data.materialien.filter((material) =>
      assets.some((asset) => asset.materialId === material.id)
    ),
    wartungsaufgaben,
    kostenprognosen,
    uebergabeCheckliste,
    betriebskostenHinweise,
    uebergabedokumente,
  }
}

export function buildAktivitaetsUebersicht(
  data: ProjectDashboardData
): AktivitaetsUebersicht {
  const planversionById = new Map(
    data.planversionen.map((planversion) => [planversion.id, planversion])
  )
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )
  const materialById = new Map(
    data.materialien.map((material) => [material.id, material])
  )
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]))
  const entscheidungById = new Map(
    data.entscheidungen.map((entscheidung) => [entscheidung.id, entscheidung])
  )
  const kostenprognoseById = new Map(
    data.kostenprognosen.map((prognose) => [prognose.id, prognose])
  )

  const aktivitaeten = [...data.aktivitaeten]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .map((aktivitaet) => ({
      ...aktivitaet,
      bezugLabels: {
        planversion: aktivitaet.bezug.planversionId
          ? planversionById.get(aktivitaet.bezug.planversionId)?.version
          : undefined,
        konflikt: aktivitaet.bezug.konfliktId
          ? konfliktById.get(aktivitaet.bezug.konfliktId)?.titel
          : undefined,
        material: aktivitaet.bezug.materialId
          ? materialById.get(aktivitaet.bezug.materialId)?.name
          : undefined,
        asset: aktivitaet.bezug.assetId
          ? assetById.get(aktivitaet.bezug.assetId)?.name
          : undefined,
        entscheidung: aktivitaet.bezug.entscheidungId
          ? entscheidungById.get(aktivitaet.bezug.entscheidungId)?.titel
          : undefined,
        kostenprognose: aktivitaet.bezug.kostenprognoseId
          ? (() => {
              const prognose = kostenprognoseById.get(
                aktivitaet.bezug.kostenprognoseId
              )
              return prognose
                ? formatEuroFromCent(prognose.gesamtMehrkostenCent)
                : undefined
            })()
          : undefined,
      },
    }))

  const auditEintraege = [...data.auditEintraege].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )

  return {
    projekt: data.projekt,
    standort: data.standort,
    aktivitaeten,
    auditEintraege,
  }
}

export function buildAnalyticsUebersicht(
  data: ProjectDashboardData
): AnalyticsUebersicht {
  const aktivitaeten = data.aktivitaeten
    .filter(
      (aktivitaet) =>
        aktivitaet.art === "material_aktualisiert" ||
        aktivitaet.quelle === "mock" ||
        aktivitaet.quelle === "vision" ||
        aktivitaet.quelle === "eap" ||
        aktivitaet.quelle === "erp" ||
        Boolean(aktivitaet.bezug.konfliktId)
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    kostenprognosen: data.kostenprognosen,
    materialien: data.materialien,
    konflikte: data.konflikte,
    aktivitaeten,
  }
}

export function buildKostenprognosenUebersicht(
  data: ProjectDashboardData
): KostenprognosenUebersicht {
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )

  const kostenprognosen: KostenprognoseMitKontext[] = data.kostenprognosen
    .map((prognose) => ({
      ...prognose,
      konfliktTitel: prognose.konfliktId
        ? konfliktById.get(prognose.konfliktId)?.titel
        : undefined,
    }))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    kostenprognosen,
    gesamtMehrkostenCent: kostenprognosen.reduce(
      (sum, prognose) => sum + prognose.gesamtMehrkostenCent,
      0
    ),
    gesamtZeitwirkungTage: kostenprognosen.reduce(
      (sum, prognose) => sum + prognose.zeitwirkungTage,
      0
    ),
  }
}

export function buildStandortUebersicht(
  data: ProjectDashboardData
): StandortUebersicht {
  const konflikte = data.konflikte.filter(
    (konflikt) => konflikt.standortId === data.standort.id
  )

  const konfliktIds = new Set(konflikte.map((konflikt) => konflikt.id))
  const konfliktById = new Map(
    konflikte.map((konflikt) => [konflikt.id, konflikt])
  )

  const kostenprognosen: KostenprognoseMitKontext[] = data.kostenprognosen
    .filter(
      (prognose) => prognose.konfliktId && konfliktIds.has(prognose.konfliktId)
    )
    .map((prognose) => ({
      ...prognose,
      konfliktTitel: prognose.konfliktId
        ? konfliktById.get(prognose.konfliktId)?.titel
        : undefined,
    }))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt: data.projekt,
    standort: data.standort,
    konflikte,
    kostenprognosen,
  }
}

export function buildRoadmapUebersicht(data: ProjectDashboardData): RoadmapUebersicht {
  const aktivesSzenario =
    data.terminplanSzenarien.find((s) => s.istAktiv) ??
    data.terminplanSzenarien[0]

  if (!aktivesSzenario) {
    throw new RepositoryError("Kein Terminplan-Szenario gefunden.", 500)
  }

  const szenarioAbschnitte = data.bauabschnitte.filter(
    (a) => a.szenarioId === aktivesSzenario.id
  )

  const konfliktById = new Map(data.konflikte.map((k) => [k.id, k]))
  const materialById = new Map(data.materialien.map((m) => [m.id, m]))

  const bauabschnitte = szenarioAbschnitte.map((abschnitt) => ({
    ...abschnitt,
    kumulierteVerschiebungTage: kumulierteVerschiebungTage(
      abschnitt.id,
      data.terminplanVerschiebungen
    ),
    blockierungenAktiv: data.terminplanBlockierungen.filter(
      (b) => b.bauabschnittId === abschnitt.id && b.status === "aktiv"
    ),
    konfliktTitel: abschnitt.konfliktIds
      .map((id) => konfliktById.get(id)?.titel)
      .filter((t): t is string => Boolean(t)),
    materialNamen: abschnitt.materialIds
      .map((id) => materialById.get(id)?.name)
      .filter((n): n is string => Boolean(n)),
  }))

  const pfad = berechneKritischerPfad(
    szenarioAbschnitte,
    data.bauabschnittAbhaengigkeiten
  )

  const planungskonflikte = erkennePlanungskonflikte(
    szenarioAbschnitte,
    data.materialien,
    data.bestellungen,
    data.terminplanBlockierungen
  )

  return {
    projekt: data.projekt,
    standort: data.standort,
    szenarien: data.terminplanSzenarien,
    aktivesSzenario,
    bauabschnitte,
    abhaengigkeiten: data.bauabschnittAbhaengigkeiten,
    verschiebungen: [...data.terminplanVerschiebungen].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    blockierungen: data.terminplanBlockierungen,
    konflikte: data.konflikte,
    materialien: data.materialien,
    bestellungen: data.bestellungen,
    mitarbeiter: data.mitarbeiter,
    mitarbeiterAusfaelle: data.mitarbeiterAusfaelle,
    bauabschnittMitarbeiter: data.bauabschnittMitarbeiter,
    kritischerPfadEnddatum: pfad.enddatum,
    kritischerPfadTage: pfad.gesamtDauerTage,
    planungskonflikte,
  }
}
