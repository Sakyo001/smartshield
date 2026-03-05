import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    // Collect cookies Supabase wants to set, then apply them to
    // the final redirect response so the session survives the redirect.
    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookiesToSet.push({ name, value, options })
          },
          remove(name: string, options: Record<string, unknown>) {
            cookiesToSet.push({ name, value: "", options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Sync user to users table
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
          
          if (!existingUser) {
            // Create new user in users table with 'user' role
            await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'user', // Default role for OAuth users
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
              })
          } else {
            // Update last_login for existing user
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', user.id)
          }
          
          // Link social account if OAuth provider
          if (user.app_metadata?.provider && user.app_metadata?.provider !== 'email') {
            try {
              await supabase
                .from('user_social_accounts')
                .insert({
                  user_id: user.id,
                  provider: user.app_metadata.provider,
                  provider_user_id: user.id,
                  email: user.email,
                  avatar_url: user.user_metadata?.avatar_url
                })
            } catch (socialAccountError) {
              // Ignore duplicate errors
              console.debug('Social account link error (may be duplicate):', socialAccountError)
            }
          }
        } catch (syncError) {
          console.error('Error syncing user:', syncError)
          // Continue even if sync fails
        }
        
        // Redirect to user's dashboard
        const redirectPath = next || `/dashboard/${user.id}`

        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"
        // NEXT_PUBLIC_SITE_URL takes highest priority in production to avoid
        // Railway's x-forwarded-host pointing to an internal hostname.
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

        let redirectTo: string
        if (isLocalEnv) {
          redirectTo = `${origin}${redirectPath}`
        } else if (siteUrl) {
          redirectTo = `${siteUrl.replace(/\/$/, "")}${redirectPath}`
        } else if (forwardedHost) {
          redirectTo = `https://${forwardedHost}${redirectPath}`
        } else {
          redirectTo = `${origin}${redirectPath}`
        }

        // Build the redirect response and attach the session cookies so
        // the session is available immediately after the redirect.
        const response = NextResponse.redirect(redirectTo)
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set({ name, value, ...(options as Record<string, unknown>) })
        }
        return response
      }
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
