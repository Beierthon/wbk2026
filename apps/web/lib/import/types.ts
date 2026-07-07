export interface ErpMaterialImportRow {
  materialId?: string
  name?: string
  bestellt?: number
  geliefert?: number
  verbaut?: number
  verbleibend?: number
}

export interface ErpJsonImportPayload {
  quelle?: string
  materialien: ErpMaterialImportRow[]
}

export interface ParsedErpImport {
  quelle?: string
  rows: Array<{
    materialId: string
    bestellt?: number
    geliefert?: number
    verbaut?: number
    verbleibend?: number
  }>
}
