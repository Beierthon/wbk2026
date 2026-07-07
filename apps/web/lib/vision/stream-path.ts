export function visionStreamStoragePath(projectId: string, sessionId: string) {
  return `${projectId}/streams/${sessionId}/latest.jpg`
}

export function isVisionStreamPathForProject(
  storagePath: string,
  projectId: string
) {
  return storagePath.startsWith(`${projectId}/streams/`)
}
