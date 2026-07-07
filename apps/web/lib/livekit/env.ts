const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

export function hasLiveKitPublicEnv() {
  return Boolean(livekitUrl)
}

export function hasLiveKitServerEnv() {
  return Boolean(
    process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && livekitUrl
  )
}

export function getLiveKitPublicUrl() {
  if (!livekitUrl) {
    throw new Error("Missing NEXT_PUBLIC_LIVEKIT_URL")
  }

  return livekitUrl
}

export function getLiveKitServerEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret || !livekitUrl) {
    throw new Error(
      "Missing LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or NEXT_PUBLIC_LIVEKIT_URL"
    )
  }

  return {
    apiKey,
    apiSecret,
    url: livekitUrl,
  }
}
