import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Prefix bucket yang boleh disajikan. Format key: <prefix>/<employeeId>/<file>
const ALLOWED_PREFIXES = new Set(["avatars", "documents", "attendances", "leave_attachments"]);
// Foto profil terlihat oleh semua pengguna login (katalog karyawan); sisanya hanya pemilik & admin.
const SHARED_PREFIXES = new Set(["avatars"]);
const INLINE_TYPES = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const me = (session as any)?.employee as { id: string; role: string | null } | undefined;
  if (!session?.user?.email || !me) return new Response("Unauthorized", { status: 401 });

  const { path } = await params;
  const segments = path.map((s) => decodeURIComponent(s));
  if (segments.length < 3 || segments.some((s) => !s || s === "." || s === ".." || s.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }
  const [prefix, ownerId] = segments;
  if (!ALLOWED_PREFIXES.has(prefix)) return new Response("Not found", { status: 404 });

  const isAdmin = Boolean((session.user as any).isAdmin);
  if (!SHARED_PREFIXES.has(prefix) && !isAdmin && ownerId !== me.id) {
    // Atasan langsung boleh membaca lampiran cuti bawahannya (untuk memutuskan persetujuan)
    let allowed = false;
    if (prefix === "leave_attachments") {
      const [owner] = await getDb().select({ manager_id: employees.manager_id }).from(employees).where(eq(employees.id, ownerId)).limit(1);
      allowed = owner?.manager_id === me.id;
    }
    if (!allowed) return new Response("Forbidden", { status: 403 });
  }

  const { env } = getCloudflareContext() as any;
  const object = await env?.STORAGE?.get(segments.join("/"));
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  const type = headers.get("content-type") ?? "application/octet-stream";
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600");
  headers.set("x-content-type-options", "nosniff");
  // Cegah konten aktif (HTML/SVG dsb.) dieksekusi dari origin aplikasi
  headers.set("content-security-policy", "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  if (!INLINE_TYPES.test(type)) {
    headers.set("content-type", "application/octet-stream");
    headers.set("content-disposition", "attachment");
  }
  return new Response(object.body, { headers });
}
