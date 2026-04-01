import { NextResponse, type NextRequest } from "next/server"

import { appClient, onboardingClient } from "./lib/auth0" // Adjust path if your auth0 client is elsewhere

export async function middleware(request: NextRequest) {
  if (request.url.includes("/onboarding")) {
    return await onboardingClient.middleware(request)
  } else {
    const res = await appClient.middleware(request)
    if (res.status >= 500 && request.nextUrl.pathname.startsWith("/my-org/")) {
      const raw = await res.clone().text()
      const detail =
        raw === "[object Object]"
          ? "(SDK returned non-string cause — check Next.js terminal for stack)"
          : raw
      console.error(
        `[proxy 500] ${request.nextUrl.pathname}:`,
        raw,
        "| cause may be logged above by nextjs-auth0"
      )
      return new NextResponse(
        JSON.stringify({ error: detail, path: request.nextUrl.pathname }),
        { status: 500, headers: { "content-type": "application/json" } }
      )
    }
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.png).*)",
  ],
}
