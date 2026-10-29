import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "./lib/db";
import { users, accounts, sessions, verificationTokens, employees } from "./lib/db/schema";

const adapterMethods = [
  "createUser", "getUser", "getUserByEmail", "getUserByAccount",
  "updateUser", "deleteUser", "linkAccount", "unlinkAccount",
  "createSession", "getSessionAndUser", "updateSession", "deleteSession",
  "createVerificationToken", "useVerificationToken"
];

const lazyAdapter = {} as any;
for (const method of adapterMethods) {
  lazyAdapter[method] = async (...args: any[]) => {
    const db = getDb();
    const adapter = DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });
    return (adapter as any)[method](...args);
  };
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      const email = token?.email || session?.user?.email;
      if (session.user && email) {
        session.user.email = email as string;
        try {
          const db = getDb();
          const userEmail = email.toString().toLowerCase().trim();
          const empRecords = await db.select().from(employees);
          const emp = empRecords.find(e => 
            (e.email || '').toLowerCase().trim() === userEmail ||
            (e.institutional_email || '').toLowerCase().trim() === userEmail
          );
          if (emp) {
            (session as any).employee = emp;
            (session.user as any).role = emp.role;
            (session.user as any).approval_status = emp.approval_status;
            (session.user as any).profile_completed = emp.profile_completed;
          } else {
            // New user — not in employees table yet, will be auto-registered on first access
            (session.user as any).role = 'Karyawan';
            (session.user as any).approval_status = 'Pending';
            (session.user as any).profile_completed = 0;
          }
        } catch (e) {
          console.error("Error attaching employee to session:", e);
        }
      }
      return session;
    },
    async signIn() {
      return true;
    }
  },
  session: {
    strategy: "jwt",
  }
});
