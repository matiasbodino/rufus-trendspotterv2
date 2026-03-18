import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const TEAM_USERS = [
  { email: "mati@rufus.social", name: "Mati", password: "rufus2026" },
  { email: "team@rufus.social", name: "Rufus Team", password: "rufus2026" },
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Rufus Social",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = TEAM_USERS.find(
          (u) =>
            u.email === credentials.email &&
            u.password === credentials.password
        )

        if (user) {
          return { id: user.email, email: user.email, name: user.name }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
