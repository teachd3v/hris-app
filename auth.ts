import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "./lib/db";
import { users, accounts, sessions, verificationTokens, employees } from "./lib/db/schema";
import { eq } from "drizzle-orm";

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
  adapter: lazyAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Verify if user is an employee
        const db = getDb();
        const employeeRecord = await db.select().from(employees).where(eq(employees.email, user.email));
        if (employeeRecord.length > 0) {
          (session as any).employee = employeeRecord[0];
          (session.user as any).role = employeeRecord[0].role;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Optional: Restrict to only allow users who exist in employees table
      // const db = getDb();
      // const employeeRecord = await db.select().from(employees).where(eq(employees.email, user.email));
      // if (employeeRecord.length === 0) return false; // Reject sign in
      return true;
    }
  },
  session: {
    strategy: "database", // Use database sessions with DrizzleAdapter
  }
});
