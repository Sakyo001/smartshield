import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page instead of /api/error
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.email === "admin@example.com" ? "admin" : "user"
      }
      return token
    },
  },
}

export default NextAuth(authOptions)
