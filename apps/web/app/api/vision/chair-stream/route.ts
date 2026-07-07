import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      data: null,
      error: {
        message:
          "Der Snapshot-Stream wurde durch LiveKit WebRTC ersetzt. Nutze das Live-Objekterkennung-Panel.",
      },
      deprecated: true,
      successor: "/api/livekit/token",
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      data: null,
      error: {
        message:
          "Der Snapshot-Stream wurde durch LiveKit WebRTC ersetzt. Nutze das Live-Objekterkennung-Panel.",
      },
      deprecated: true,
      successor: "/api/livekit/token",
    },
    { status: 410 }
  )
}
