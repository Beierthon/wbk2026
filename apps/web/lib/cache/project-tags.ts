export function projectCacheTag(projectId: string) {
  return `project:${projectId}`
}

export function projectAreaTag(projectId: string, area: string) {
  return `project:${projectId}:${area}`
}
