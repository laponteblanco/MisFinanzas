import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy: El Nuevo Guardián de Next.js 16 (Anteriormente Middleware)
 * Sincroniza la sesión de Supabase y gestiona redirecciones protegidas.
 * Optimizado para minimizar la latencia en dispositivos móviles.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ⚡ Bypass inmediato para recursos estáticos (no necesitan verificación de sesión)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // archivos estáticos: .js, .css, .png, .ico, etc.
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  )

  // Verificamos sesión
  const { data: { session } } = await supabase.auth.getSession()

  // 1. Redirección si intenta acceder al Dashboard sin sesión
  if (pathname.startsWith('/dashboard') && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Redirección si intenta acceder al Login ya estando autenticado
  if (pathname.startsWith('/login') && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Configuración de rutas que activarán el Proxy
// Excluimos explícitamente archivos estáticos para evitar latencia innecesaria
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ],
}

