import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        const supabase = await createAdminClient()

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, tenant_id, is_active')
          .eq('email', user.email)
          .single()

        if (existingUser) {
          if (!existingUser.is_active) return false

          // Update last login
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', existingUser.id)

          return true
        }

        // New user — create tenant + user
        const slug = nanoid(8).toLowerCase()
        const displayName = user.name || user.email.split('@')[0]

        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            slug,
            name: `${displayName}'s Practice`,
            advisor_name: displayName,
            company_email: user.email,
          })
          .select()
          .single()

        if (tenantError || !tenant) {
          console.error('Tenant creation failed:', tenantError)
          return false
        }

        // Create user as owner
        const { error: userError } = await supabase.from('users').insert({
          tenant_id: tenant.id,
          email: user.email,
          name: displayName,
          avatar_url: user.image,
          role: 'owner',
        })

        if (userError) {
          console.error('User creation failed:', userError)
          return false
        }

        // Create trial subscription on Starter plan
        const { data: starterPlan } = await supabase
          .from('plans')
          .select('id')
          .eq('name', 'starter')
          .single()

        if (starterPlan) {
          await supabase.from('subscriptions').insert({
            tenant_id: tenant.id,
            plan_id: starterPlan.id,
            status: 'trial',
          })
        }

        return true
      } catch (err) {
        console.error('SignIn callback error:', err)
        return false
      }
    },

    async session({ session }) {
      if (!session.user?.email) return session

      try {
        const supabase = await createAdminClient()

        const { data: dbUser } = await supabase
          .from('users')
          .select('id, tenant_id, role, name')
          .eq('email', session.user.email)
          .single()

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.tenantId = dbUser.tenant_id
          session.user.role = dbUser.role
          session.user.name = dbUser.name
        }
      } catch (err) {
        console.error('Session callback error:', err)
      }

      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      tenantId: string
      role: string
      name: string
      email: string
      image?: string
    }
  }
}
