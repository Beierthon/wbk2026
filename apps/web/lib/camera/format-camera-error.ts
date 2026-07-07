export function formatCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "Kamerazugriff wurde verweigert. Bitte erlaube die Kamera in den Browser-Einstellungen und lade die Seite neu."
      case "NotFoundError":
        return "Keine Kamera gefunden. Pruefe, ob dein Geraet eine Kamera hat."
      case "NotReadableError":
        return "Die Kamera wird bereits von einer anderen App genutzt."
      case "SecurityError":
        return "Kamerazugriff ist nur ueber HTTPS oder localhost moeglich."
      case "OverconstrainedError":
        return "Die gewuenschte Kamera ist auf diesem Geraet nicht verfuegbar."
      default:
        return error.message || "Kamera konnte nicht gestartet werden."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Kamera konnte nicht gestartet werden."
}
