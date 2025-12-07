import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedRoutes = [
    "/dashboard",
    "/exercises",
    "/workouts",
    "/friends",
    "/leaderboard",
  ];

  const isProtected = protectedRoutes.some((r) =>
    req.nextUrl.pathname.startsWith(r)
  );

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if user has a username (except for profile page)
  if (session && isProtected && !req.nextUrl.pathname.startsWith("/profile")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .single();

    if (!profile || !profile.username) {
      return NextResponse.redirect(new URL("/profile?setup=true", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/exercises/:path*",
    "/workouts/:path*",
    "/friends/:path*",
    "/leaderboard/:path*",
    "/profile/:path*",
  ],
};
