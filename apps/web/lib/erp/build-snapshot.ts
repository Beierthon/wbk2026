import type { ProjectDashboardData } from "../data/types"
import type { DataSourceMode } from "../data/types"
import { countSyncStatuses, resolveErpEapSyncStatus } from "./sync-status"
import type {
  ErpEapReferenzSnapshot,
  ErpEapSnapshot,
  ErpLeistungswertSnapshot,
  ErpMaterialSnapshot,
} from "./types"

function toReferenzSnapshot(
  referenz: ProjectDashboardData["externeReferenzen"][number],
  bezugLabel?: string
): ErpEapReferenzSnapshot {
  return {
    referenz,
    syncStatus: resolveErpEapSyncStatus(referenz),
    bezugLabel,
  }
}

function findReferenzLabel(
  data: ProjectDashboardData,
  referenz: ProjectDashboardData["externeReferenzen"][number]
): string | undefined {
  const bestellung = data.bestellungen.find(
    (item) => item.externeReferenzId === referenz.id
  )
  if (bestellung) {
    const material = data.materialien.find(
      (item) => item.id === bestellung.materialId
    )
    return material ? `Bestellung ${material.name}` : "Bestellung"
  }

  if (referenz.objektTyp === "asset") {
    const asset = data.assets[0]
    return asset ? `Asset ${asset.name}` : "Asset"
  }

  if (referenz.objektTyp === "kostenstelle") {
    const konflikt = data.konflikte[0]
    return konflikt ? `Kostenstelle ${konflikt.titel}` : "Kostenstelle"
  }

  if (referenz.objektTyp === "material") {
    const material = data.materialien.find(
      (item) => item.id === "material-drainagevlies"
    )
    return material ? `Material ${material.name}` : "Material"
  }

  return referenz.objektTyp
}

export function buildErpEapSnapshot(
  projectId: string,
  data: ProjectDashboardData,
  adapterSource: DataSourceMode
): ErpEapSnapshot {
  const referenzen = data.externeReferenzen.map((referenz) =>
    toReferenzSnapshot(referenz, findReferenzLabel(data, referenz))
  )

  const referenzById = new Map(referenzen.map((item) => [item.referenz.id, item]))

  const materialien: ErpMaterialSnapshot[] = data.materialien.map((material) => {
    const bestellung = data.bestellungen.find(
      (item) => item.materialId === material.id
    )
    const externeReferenz = bestellung?.externeReferenzId
      ? referenzById.get(bestellung.externeReferenzId)
      : referenzen.find(
          (item) =>
            item.referenz.objektTyp === "material" &&
            item.referenz.externerSchluessel.includes("DRN")
        )

    return {
      material,
      bestellung,
      lieferstatus: bestellung?.status,
      externeReferenz,
    }
  })

  const kostenstellen = referenzen.filter(
    (item) => item.referenz.objektTyp === "kostenstelle"
  )

  const assets = referenzen.filter((item) => item.referenz.objektTyp === "asset")

  const prognose = data.kostenprognosen[0]
  const leistungswerte: ErpLeistungswertSnapshot[] = [
    {
      label: "Material-Mehrkosten",
      wert: prognose
        ? `${(prognose.materialMehrkostenCent / 100).toLocaleString("de-DE")} EUR`
        : "—",
      quelle: "eap",
      referenz: kostenstellen[0],
    },
    {
      label: "Arbeits-Mehrkosten",
      wert: prognose
        ? `${(prognose.arbeitsMehrkostenCent / 100).toLocaleString("de-DE")} EUR`
        : "—",
      quelle: "eap",
      referenz: kostenstellen[0],
    },
    {
      label: "Lieferstatus Drainagevlies",
      wert: materialien[0]?.lieferstatus ?? "unbekannt",
      quelle: "erp",
      referenz: materialien[0]?.externeReferenz,
    },
  ]

  const syncZusammenfassung = countSyncStatuses(
    referenzen.map((item) => item.syncStatus)
  )

  const erpSystems = new Set(
    data.externeReferenzen
      .filter((item) => item.system === "erp" || item.system === "eap")
      .map((item) => item.systemName)
  )

  return {
    projektId: projectId,
    adapterSource,
    systemLabel:
      erpSystems.size > 0
        ? Array.from(erpSystems).join(" / ")
        : "Mock-Adapter",
    abgerufenAm: new Date().toISOString(),
    referenzen,
    materialien,
    kostenstellen,
    assets,
    leistungswerte,
    syncZusammenfassung,
  }
}
