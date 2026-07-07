import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"
import { describe, expect, it } from "vitest"

import {
  inspectVisionFrame,
  validateVisionInspectRequest,
} from "./inspect-frame"

describe("validateVisionInspectRequest", () => {
  it("lehnt leere Anfragen ab", () => {
    expect(validateVisionInspectRequest({})).toEqual({
      code: "validation",
      message:
        "projectId oder mindestens ein expectedItem ist fuer den Vision-Scan erforderlich.",
    })
  })

  it("akzeptiert projectId ohne expectedItems", () => {
    expect(validateVisionInspectRequest({ projectId: WBK_DEMO_PROJECT_ID })).toBeNull()
  })
})

describe("inspectVisionFrame", () => {
  it("liefert Bounding Boxes und ERP-Matching fuer Demo-Materialien", async () => {
    const result = await inspectVisionFrame({
      projectId: WBK_DEMO_PROJECT_ID,
      image: "data:image/jpeg;base64,demo-frame",
      useStableMock: true,
    })

    expect(result.mode).toBe("mock")
    expect(result.detections.length).toBeGreaterThan(0)
    expect(result.summary.needsConfirmation).toBe(true)

    const firstDetection = result.detections[0]!

    expect(firstDetection.box).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    })
    expect(firstDetection.label.length).toBeGreaterThan(0)
    expect(firstDetection.confidence).toBeGreaterThan(0)
    expect(firstDetection.systemMatch.materialName).toBe(firstDetection.label)
    expect(firstDetection.interpreted.einheit.length).toBeGreaterThan(0)
  })

  it("nutzt explizite expectedItems ohne projectId", async () => {
    const result = await inspectVisionFrame({
      expectedItems: [
        {
          id: "material-test",
          name: "Testmaterial",
          einheit: "stk",
          geliefert: 10,
          verbaut: 2,
          verbleibend: 8,
          externeReferenz: "PO-TEST-1",
        },
      ],
      useStableMock: false,
    })

    expect(result.detections).toHaveLength(1)
    expect(result.detections[0]?.systemMatch.externeReferenz).toBe("PO-TEST-1")
  })
})
