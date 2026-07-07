import { describe, expect, it } from "vitest"

import { formatCameraError } from "./format-camera-error"

describe("formatCameraError", () => {
  it("maps permission denial to a German explanation", () => {
    const error = new DOMException("Permission denied", "NotAllowedError")

    expect(formatCameraError(error)).toContain("verweigert")
  })

  it("maps missing camera to a German explanation", () => {
    const error = new DOMException("No device", "NotFoundError")

    expect(formatCameraError(error)).toContain("Keine Kamera")
  })

  it("falls back for unknown errors", () => {
    expect(formatCameraError("kaputt")).toBe(
      "Kamera konnte nicht gestartet werden."
    )
  })
})
