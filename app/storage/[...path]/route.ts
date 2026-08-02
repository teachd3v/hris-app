import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  
  try {
    const { env } = getCloudflareContext() as any;
    if (env?.STORAGE) {
      const object = await env.STORAGE.get(key);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        return new Response(object.body, { headers });
      }
    }
  } catch (e) {
    console.error("Storage R2 binding error:", e);
  }

  // Fallback to fetching R2 public URL if binding fails
  const r2PublicUrl = process.env.R2_PUBLIC_URL || "https://pub-2d729e2730464d84a7536597000e628a.r2.dev";
  const fallbackRes = await fetch(`${r2PublicUrl}/${key}`);
  if (fallbackRes.ok) {
    return new Response(fallbackRes.body, {
      headers: {
        "content-type": fallbackRes.headers.get("content-type") || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}
