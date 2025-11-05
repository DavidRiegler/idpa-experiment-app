import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Für diese Anwendung brauchen wir keine Auth-Middleware
  // da es ein öffentliches Experiment ist
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
