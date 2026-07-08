import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { NextRequest } from "next/server"

const slidesIndexPath = join(process.cwd(), "public/slides/index.html")
const slidesHtmlPromise = readFile(slidesIndexPath, "utf-8")

const SLIDES_STATIC_PREFIXES = ["/slides/assets/", "/slides/fonts/"]

function isSlidesStaticAsset(pathname: string) {
  if (pathname === "/slides/index.html" || pathname === "/slides/404.html") {
    return true
  }

  if (SLIDES_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }

  return /\.[a-z0-9]+$/i.test(pathname)
}

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isSlidesStaticAsset(pathname)) {
    return new Response("Not found", { status: 404 })
  }

  const html = await slidesHtmlPromise

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
