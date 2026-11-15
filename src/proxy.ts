import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { ROL_HOME } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isComercianteRoute = pathname.startsWith("/comerciante");
  const isReceptorRoute = pathname.startsWith("/receptor");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isComercianteRoute && !isReceptorRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (isComercianteRoute && session.rol !== "COMERCIANTE") {
    return NextResponse.redirect(new URL(ROL_HOME[session.rol], request.url));
  }
  if (isReceptorRoute && session.rol !== "RECEPTOR") {
    return NextResponse.redirect(new URL(ROL_HOME[session.rol], request.url));
  }
  if (isAdminRoute && session.rol !== "ADMIN") {
    return NextResponse.redirect(new URL(ROL_HOME[session.rol], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/comerciante/:path*", "/receptor/:path*", "/admin/:path*"],
};
