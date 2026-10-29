import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql, eq } from "drizzle-orm";
import { getDb } from "./lib/db";
import { employees, employee_credentials } from "./lib/db/schema";
import { verifyPassword, MAX_FAILED_ATTEMPTS, LOCK_MINUTES } from "./lib/password";

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;

        const db = getDb();
        const [emp] = await db
          .select({ id: employees.id, name: employees.name, email: employees.email })
          .from(employees)
          .where(sql`lower(${employees.email}) = ${email}`)
          .limit(1);
        if (!emp) return null;

        const [cred] = await db.select().from(employee_credentials).where(eq(employee_credentials.employee_id, emp.id)).limit(1);
        const now = Date.now();
        if (cred?.locked_until && new Date(cred.locked_until).getTime() > now) return null;

        const ok = await verifyPassword(password, cred?.password_hash ?? null);
        if (!ok) {
          const attempts = (cred?.failed_attempts ?? 0) + 1;
          const locked = attempts >= MAX_FAILED_ATTEMPTS;
          const patch = {
            failed_attempts: locked ? 0 : attempts,
            locked_until: locked ? new Date(now + LOCK_MINUTES * 60_000).toISOString() : null,
          };
          if (cred) await db.update(employee_credentials).set(patch).where(eq(employee_credentials.employee_id, emp.id));
          else await db.insert(employee_credentials).values({ employee_id: emp.id, ...patch });
          return null;
        }

        if (cred && (cred.failed_attempts || cred.locked_until)) {
          await db.update(employee_credentials).set({ failed_attempts: 0, locked_until: null }).where(eq(employee_credentials.employee_id, emp.id));
        }
        return { id: emp.id, name: emp.name, email: emp.email, pwv: cred?.password_changed_at ?? "" } as any;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.pwv = (user as any).pwv ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      const db = getDb();
      const [emp] = await db
        .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role, photo_url: employees.photo_url })
        .from(employees)
        .where(eq(employees.id, token.sub as string))
        .limit(1);
      const [cred] = await db
        .select({ changed: employee_credentials.password_changed_at })
        .from(employee_credentials)
        .where(eq(employee_credentials.employee_id, token.sub as string))
        .limit(1);

      // Karyawan dihapus, atau password diubah/direset setelah token terbit -> sesi tidak berlaku lagi
      if (!emp || (cred?.changed ?? "") !== ((token.pwv as string) ?? "")) {
        return { ...session, user: undefined } as any;
      }
      session.user.id = emp.id;
      session.user.email = emp.email ?? session.user.email;
      (session as any).employee = emp;
      (session.user as any).role = emp.role;
      return session;
    },
  },
});
