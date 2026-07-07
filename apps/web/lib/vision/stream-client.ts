import type { RealtimeChannel } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"

import { visionStreamStoragePath } from "./stream-path"
import {
  VISION_STREAM_BUCKET,
  VISION_STREAM_SOURCE,
  VISION_STREAM_TABLE,
  type VisionStreamDetection,
  type VisionStreamSessionRow,
  type VisionStreamSnapshot,
  type VisionStreamSummary,
} from "./stream-types"
import {
  VISION_STREAM_SIGNED_URL_TTL,
  VISION_STREAM_STALE_MS,
} from "./scan-config"
import { isVisionStreamFresh } from "./stream-types"

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch("http://127.0.0.1:7437/ingest/9c05bea6-43f7-4dc2-b604-23cc60fa1143", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "66afc8",
    },
    body: JSON.stringify({
      sessionId: "66afc8",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

export type VisionStreamConnectionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "error"

const signedUrlCache = new Map<string, { baseUrl: string; expiresAt: number }>()

function withCacheBuster(url: string, version: string) {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${encodeURIComponent(version)}`
}

async function signedImageUrl(storagePath: string, version: string) {
  const now = Date.now()
  const cached = signedUrlCache.get(storagePath)

  if (cached && cached.expiresAt > now + 60_000) {
    return withCacheBuster(cached.baseUrl, version)
  }

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(VISION_STREAM_BUCKET)
    .createSignedUrl(storagePath, VISION_STREAM_SIGNED_URL_TTL)

  if (error || !data?.signedUrl) {
    return null
  }

  signedUrlCache.set(storagePath, {
    baseUrl: data.signedUrl,
    expiresAt: now + VISION_STREAM_SIGNED_URL_TTL * 1000,
  })

  return withCacheBuster(data.signedUrl, version)
}

export async function rowToSnapshot(
  row: VisionStreamSessionRow
): Promise<VisionStreamSnapshot | null> {
  const version = row.updated_at ?? row.captured_at
  const image = await signedImageUrl(row.storage_path, version)

  if (!image) {
    return null
  }

  return {
    id: row.id,
    sessionId: row.id,
    projectId: row.projekt_id,
    capturedAt: row.captured_at,
    updatedAt: row.updated_at ?? row.captured_at,
    image,
    detectionCount: row.detection_count,
    detections: Array.isArray(row.detections) ? row.detections : [],
    summary: row.summary ?? {
      message: "",
      source: VISION_STREAM_SOURCE,
      mode: "scan",
    },
    source: VISION_STREAM_SOURCE,
  }
}

export async function startVisionStreamSession(
  projectId: string,
  sessionId: string
) {
  const supabase = createClient()
  const storagePath = visionStreamStoragePath(projectId, sessionId)
  const capturedAt = new Date().toISOString()

  const { error } = await supabase.from(VISION_STREAM_TABLE).insert({
    id: sessionId,
    projekt_id: projectId,
    storage_path: storagePath,
    detections: [],
    detection_count: 0,
    summary: {
      message: "Kamerastream gestartet.",
      source: VISION_STREAM_SOURCE,
      mode: "scan",
    },
    captured_at: capturedAt,
    active: true,
  })

  if (error) {
    debugLog("H3", "stream-client.ts:startVisionStreamSession", "session insert failed", {
      projectId,
      sessionId,
      storagePath,
      code: error.code,
      message: error.message,
    })
    throw new Error(`Session: ${error.message}`)
  }

  debugLog("H3", "stream-client.ts:startVisionStreamSession", "session insert ok", {
    projectId,
    sessionId,
    storagePath,
  })
}

export async function publishVisionStreamFrame(
  projectId: string,
  sessionId: string,
  frame: {
    blob: Blob
    capturedAt: string
    detections: VisionStreamDetection[]
    summary: VisionStreamSummary
  }
) {
  const supabase = createClient()
  const storagePath = visionStreamStoragePath(projectId, sessionId)

  const { error: uploadError } = await supabase.storage
    .from(VISION_STREAM_BUCKET)
    .upload(storagePath, frame.blob, {
      contentType: "image/jpeg",
      upsert: true,
    })

  if (uploadError) {
    debugLog("H1", "stream-client.ts:publishVisionStreamFrame", "storage upload failed", {
      projectId,
      sessionId,
      storagePath,
      code: uploadError.name,
      message: uploadError.message,
    })
    throw new Error(`Storage: ${uploadError.message}`)
  }

  debugLog("H1", "stream-client.ts:publishVisionStreamFrame", "storage upload ok", {
    projectId,
    sessionId,
    storagePath,
    detectionCount: frame.detections.length,
  })

  const { error: updateError } = await supabase
    .from(VISION_STREAM_TABLE)
    .update({
      detections: frame.detections,
      detection_count: frame.detections.length,
      summary: frame.summary,
      captured_at: frame.capturedAt,
      active: true,
    })
    .eq("id", sessionId)
    .eq("projekt_id", projectId)

  if (updateError) {
    debugLog("H2", "stream-client.ts:publishVisionStreamFrame", "session update failed", {
      projectId,
      sessionId,
      code: updateError.code,
      message: updateError.message,
    })
    throw new Error(`Update: ${updateError.message}`)
  }

  debugLog("H2", "stream-client.ts:publishVisionStreamFrame", "session update ok", {
    projectId,
    sessionId,
    detectionCount: frame.detections.length,
  })
}

export async function endVisionStreamSession(
  projectId: string,
  sessionId: string
) {
  const supabase = createClient()

  const { error } = await supabase
    .from(VISION_STREAM_TABLE)
    .update({ active: false })
    .eq("id", sessionId)
    .eq("projekt_id", projectId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchLatestVisionStreamSnapshot(projectId: string) {
  const supabase = createClient()
  const staleCutoff = new Date(Date.now() - VISION_STREAM_STALE_MS).toISOString()

  const { data, error } = await supabase
    .from(VISION_STREAM_TABLE)
    .select("*")
    .eq("projekt_id", projectId)
    .eq("active", true)
    .gte("updated_at", staleCutoff)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const snapshot = await rowToSnapshot(data as VisionStreamSessionRow)

  if (!snapshot || !isVisionStreamFresh(snapshot)) {
    return null
  }

  return snapshot
}

export function subscribeVisionStreamSessions(
  projectId: string,
  onSnapshot: (snapshot: VisionStreamSnapshot) => void,
  onStatusChange?: (status: VisionStreamConnectionStatus) => void,
  onInactive?: () => void
) {
  const supabase = createClient()
  onStatusChange?.("connecting")

  const channel: RealtimeChannel = supabase
    .channel(`vision-stream:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: VISION_STREAM_TABLE,
        filter: `projekt_id=eq.${projectId}`,
      },
      (payload) => {
        const row = payload.new as VisionStreamSessionRow | undefined

        if (
          payload.eventType === "DELETE" ||
          (row && !row.active) ||
          !row?.storage_path
        ) {
          onInactive?.()
          return
        }

        if (
          !isVisionStreamFresh({
            updatedAt: row.updated_at,
            capturedAt: row.captured_at,
          })
        ) {
          return
        }

        void rowToSnapshot(row).then((snapshot) => {
          if (snapshot && isVisionStreamFresh(snapshot)) {
            onSnapshot(snapshot)
          }
        })
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onStatusChange?.("live")
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onStatusChange?.("error")
      }
    })

  return () => {
    onStatusChange?.("idle")
    void supabase.removeChannel(channel)
  }
}
