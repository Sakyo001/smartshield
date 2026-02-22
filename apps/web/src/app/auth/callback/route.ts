import { createClient } from "@lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
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
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      }
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
