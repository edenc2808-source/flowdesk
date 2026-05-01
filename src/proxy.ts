import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookieList) => {
          cookieList.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookieList.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (keeps auth token alive)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API routes handle their own auth — don't block here
  if (pathname.startsWith('/api/')) return response

  // Demo page is always public
  if (pathname.startsWith('/demo')) return response

  // Auth pages: redirect to inbox if already logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (user) return NextResponse.redirect(new URL('/inbox', request.url))
    return response
  }

  // Everything else requires auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
