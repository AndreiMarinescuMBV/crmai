import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

// Rute autentificate prin HMAC (joburi de sistem), nu prin sesiune de user.
// NU trebuie să treacă prin updateSession/redirect la /login.
const SYSTEM_ROUTE_PREFIXES = ["/api/documents/ingest"]

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (SYSTEM_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}