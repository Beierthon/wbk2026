import { getProjectRepository } from "@/lib/data"
import { getActiveProjectId } from "@/lib/project-session"

export const projectRepository = getProjectRepository()

export { getActiveProjectId } from "@/lib/project-session"
export { WBK_DEMO_PROJECT_ID } from "@/lib/project-constants"
