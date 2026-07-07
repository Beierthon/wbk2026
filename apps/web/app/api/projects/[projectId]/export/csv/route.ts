import { getProjectRepository } from "@/lib/data"
import { getErpSyncSnapshot } from "@/lib/erp"
import {
  aktivitaetenToCsv,
  erpSyncToCsv,
  isCsvEntitaet,
  kostenprognosenToCsv,
  materialToCsv,
} from "@/lib/export/csv"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const entitaet =
    new URL(request.url).searchParams.get("entitaet") ?? "material"

  if (!isCsvEntitaet(entitaet)) {
    return new Response("Unknown entity.", { status: 400 })
  }

  const repository = getProjectRepository()
  const { data } = await repository.getDashboardData(projectId)

  let csv = ""
  if (entitaet === "erp") {
    const snapshot = await getErpSyncSnapshot(projectId)
    csv = erpSyncToCsv(snapshot.datensaetze)
  } else if (entitaet === "material") {
    csv = materialToCsv(data.materialien)
  } else if (entitaet === "kostenprognosen") {
    csv = kostenprognosenToCsv(data.kostenprognosen)
  } else {
    csv = aktivitaetenToCsv(data.aktivitaeten)
  }

  // BOM für korrekte Umlaute in Excel.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wbk-${entitaet}.csv"`,
    },
  })
}
