import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // If Google OAuth credentials are not configured, block sign-in with a helpful message
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("[NextAuth] Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.")
        // Return false to block sign-in — NextAuth will show the error page
        return false
      }

      if (!user.email) {
        console.error("[NextAuth] No email returned from Google OAuth provider")
        return false
      }

      try {
        // Check if database tables are set up
        const existingUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, status: true },
        })

        if (existingUser) {
          // User exists — check status
          if (existingUser.status === 'DELETED' || existingUser.status === 'SUSPENDED') {
            console.warn(`[NextAuth] Blocked sign-in for ${user.email}: account status is ${existingUser.status}`)
            return false
          }
          // ACTIVE or PENDING — allow sign-in, the onboarding/callback flow handles the rest
          return true
        }

        // New user — allow sign-in, the callback page will handle onboarding
        // The user record will be created by the /api/auth/oauth/complete endpoint
        console.log(`[NextAuth] New Google OAuth user: ${user.email}`)
        return true
      } catch (err) {
        // If DB tables don't exist yet, we can't check — allow sign-in attempt
        // The callback flow will handle the error gracefully
        console.error("[NextAuth] Error checking user in DB during signIn callback:", err)
        // Allow sign-in to proceed — the /auth/callback page will show a helpful error
        // if the database isn't set up
        return true
      }
    },

    async jwt({ token, user, account }) {
      // Persist the user ID and OAuth provider info in the JWT
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.provider = account.provider
        token.accessToken = account.access_token
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id
        ;(session.user as Record<string, unknown>).provider = token.provider
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // After OAuth, redirect to our custom callback page
      // The callback page will handle user linking/creation
      if (url.startsWith("/")) return `${baseUrl}/auth/callback?provider=google`
      if (new URL(url).origin === baseUrl) return `${baseUrl}/auth/callback?provider=google`
      return `${baseUrl}/auth/callback?provider=google`
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors to the login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
