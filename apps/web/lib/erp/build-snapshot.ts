import type { ProjectDashboardData } from "@/lib/data"
import type { DataSourceMode } from "@/lib/data"
import { countByStatus, resolveErpSyncStatus } from "./sync-status"
import type { ErpSyncRecord, ErpSyncSnapshot, ErpSystemSummary } from "./types"

function buildSystemSummaries(records: ErpSyncRecord[]): ErpSystemSummary[] {
  const grouped = new Map<string, ErpSystemSummary>()

  for (const record of records) {
    const key = `${record.system}:${record.systemName}`
    const existing = grouped.get(key)

    if (!existing) {
      grouped.set(key, {
        system: record.system,
        systemName: record.systemName,
        letzteSynchronisation: record.synchronisiertAm,
        status: record.status,
        datensaetze: 1,
      })
      continue
    }

    existing.datensaetze += 1

    if (
      record.synchronisiertAm &&
      (!existing.letzteSynchronisation ||
        Date.parse(record.synchronisiertAm) >
          Date.parse(existing.letzteSynchronisation))
    ) {
      existing.letzteSynchronisation = record.synchronisiertAm
    }

    if (record.status === "manuell_ueberschrieben") {
      existing.status = "manuell_ueberschrieben"
    } else if (
      record.status === "veraltet" &&
      existing.status === "synchronisiert"
    ) {
      existing.status = "veraltet"
    } else if (
      record.status === "nicht_synchronisiert" &&
      existing.status !== "manuell_ueberschrieben"
    ) {
      existing.status = "nicht_synchronisiert"
    }
  }

  return [...grouped.values()]
}

export function buildErpSyncSnapshot(
  projectId: string,
  data: ProjectDashboardData,
  adapter: DataSourceMode,
  referenceTime: string
): ErpSyncSnapshot {
  const datensaetze: ErpSyncRecord[] = []

  for (const referenz of data.externeReferenzen) {
    const bestellung = data.bestellungen.find(
      (item) => item.externeReferenzId === referenz.id
    )
    const material = bestellung
      ? data.materialien.find((item) => item.id === bestellung.materialId)
      : undefined
    const kostenprognose = data.kostenprognosen[0]

    const manuellUeberschrieben =
      material?.status === "kritisch" &&
      data.aktivitaeten.some(
        (aktivitaet) =>
          aktivitaet.art === "material_aktualisiert" &&
          aktivitaet.bezug.materialId === material.id
      )

    datensaetze.push({
      id: referenz.id,
      system: referenz.system,
      systemName: referenz.systemName,
      objektTyp: referenz.objektTyp,
      externerSchluessel: referenz.externerSchluessel,
      interneReferenzId: bestellung?.id ?? kostenprognose?.id,
      interneBezeichnung:
        material?.name ??
        (referenz.objektTyp === "kostenstelle"
          ? "Kostenstelle Baugrund Suedfeld"
          : referenz.externerSchluessel),
      synchronisiertAm: referenz.synchronisiertAm,
      status: resolveErpSyncStatus({
        synchronisiertAm: referenz.synchronisiertAm,
        referenceTime,
        manuellUeberschrieben:
          manuellUeberschrieben && referenz.objektTyp === "bestellung",
        importiert: referenz.objektTyp === "kostenstelle",
      }),
      hinweis:
        manuellUeberschrieben && referenz.objektTyp === "bestellung"
          ? "Baustellenstand weicht vom letzten ERP-Import ab."
          : undefined,
    })
  }

  for (const asset of data.assets) {
    const material = asset.materialId
      ? data.materialien.find((item) => item.id === asset.materialId)
      : undefined

    datensaetze.push({
      id: `eap-asset-${asset.id}`,
      system: "eap",
      systemName: "EAP-Demo",
      objektTyp: "asset",
      externerSchluessel: `AST-${asset.id.replace("asset-", "").toUpperCase()}`,
      interneReferenzId: asset.id,
      interneBezeichnung: asset.name,
      synchronisiertAm: asset.updatedAt,
      status: resolveErpSyncStatus({
        synchronisiertAm: asset.updatedAt,
        referenceTime,
        manuellUeberschrieben: asset.offenePunkte.length > 0,
      }),
      hinweis:
        asset.offenePunkte.length > 0
          ? "Uebergabepunkte sind noch nicht in EAP abgeschlossen."
          : undefined,
    })

    if (material) {
      datensaetze.push({
        id: `erp-material-${material.id}`,
        system: "erp",
        systemName: "ERP-Demo",
        objektTyp: "material",
        externerSchluessel: `MAT-${material.id.replace("material-", "").toUpperCase()}`,
        interneReferenzId: material.id,
        interneBezeichnung: material.name,
        synchronisiertAm: material.updatedAt,
        status: resolveErpSyncStatus({
          synchronisiertAm: material.updatedAt,
          referenceTime,
          manuellUeberschrieben: material.status === "kritisch",
        }),
        hinweis:
          material.status === "kritisch"
            ? "Liefer- und Verbaustand erfordert ERP-Abgleich."
            : undefined,
      })
    }
  }

  for (const prognose of data.kostenprognosen) {
    const kostenstelle = data.externeReferenzen.find(
      (referenz) => referenz.objektTyp === "kostenstelle"
    )

    if (!kostenstelle) {
      continue
    }

    datensaetze.push({
      id: `eap-leistung-${prognose.id}`,
      system: "eap",
      systemName: kostenstelle.systemName,
      objektTyp: "leistungswert",
      externerSchluessel: `${kostenstelle.externerSchluessel}-LV-${prognose.zeitwirkungTage}`,
      interneReferenzId: prognose.id,
      interneBezeichnung: `Mehrkostenprognose ${prognose.gesamtMehrkostenCent / 100} EUR`,
      synchronisiertAm: prognose.updatedAt,
      status: resolveErpSyncStatus({
        synchronisiertAm: prognose.updatedAt,
        referenceTime,
      }),
      hinweis: "Leistungswerte aus Kostenprognose fuer ERP/EAP-Rueckmeldung.",
    })
  }

  return {
    projektId: projectId,
    adapter,
    generiertAm: referenceTime,
    systeme: buildSystemSummaries(datensaetze),
    datensaetze,
    zusammenfassung: countByStatus(datensaetze),
  }
}
