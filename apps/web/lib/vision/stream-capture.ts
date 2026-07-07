const STREAM_FRAME_MAX_WIDTH = 720
const STREAM_FRAME_JPEG_QUALITY = 0.6

export function captureVideoFrameBlob(
  video: HTMLVideoElement
): Promise<Blob | null> {
  const canvas = document.createElement("canvas")
  const scale = Math.min(1, STREAM_FRAME_MAX_WIDTH / video.videoWidth)

  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))

  const context = canvas.getContext("2d")

  if (!context) {
    return Promise.resolve(null)
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/jpeg",
      STREAM_FRAME_JPEG_QUALITY
    )
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("Frame konnte nicht gelesen werden."))
    }

    reader.onerror = () => reject(new Error("Frame konnte nicht gelesen werden."))
    reader.readAsDataURL(blob)
  })
}
