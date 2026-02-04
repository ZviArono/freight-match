import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  // Auth pages accessible without login
  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));

  // If not logged in and not on an auth page, redirect to login
  if (!user && !isAuthPage && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Helper: get role-based dashboard path
  async function getDashboardPath() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();
    return profile?.role === "trucker"
      ? "/trucker/dashboard"
      : "/company/dashboard";
  }

  // If logged in and on an auth page, redirect to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = await getDashboardPath();
    return NextResponse.redirect(url);
  }

  // Redirect bare /dashboard to role-specific dashboard
  if (user && pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = await getDashboardPath();
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
