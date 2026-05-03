import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/auth", "/mfa-verify"];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login (except auth pages)
  if (!user && !isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/signup (but NOT mfa-verify)
  if (
    user &&
    (pathname.startsWith("/login") || pathname.startsWith("/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // MFA enforcement: if user is logged in and has MFA factors,
  // check if the current session has been MFA-verified.
  // The Assurance Level (AAL) tells us:
  //   aal1 = password only
  //   aal2 = password + MFA verified
  if (user && !isAuthPage(pathname)) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData) {
      const { currentLevel, nextLevel } = aalData;
      // nextLevel is aal2 if user has MFA enrolled
      // currentLevel is aal1 if they haven't verified MFA this session
      if (nextLevel === "aal2" && currentLevel === "aal1") {
        const url = request.nextUrl.clone();
        url.pathname = "/mfa-verify";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
