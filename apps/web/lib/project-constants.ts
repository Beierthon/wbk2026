import {
  WBK_DEMO_PROJECT_ID,
  WBK_DEMO_PROJECT_WERKSTATT_ID,
} from "@workspace/domain/demo-data"

export const PROJECT_COOKIE = "wbk-active-project"

export const DEMO_PROJECT_IDS = [
  WBK_DEMO_PROJECT_ID,
  WBK_DEMO_PROJECT_WERKSTATT_ID,
] as const

export { WBK_DEMO_PROJECT_ID }
