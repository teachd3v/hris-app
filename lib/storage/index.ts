import { getCloudflareContext } from "@opennextjs/cloudflare";

// Penyimpanan file memakai binding R2 `STORAGE` (lihat wrangler.jsonc).
// Tipe minimal agar tidak perlu @cloudflare/workers-types.
interface R2BucketLike {
  put(key: string, body: ArrayBuffer | Blob, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(keys: string | string[]): Promise<void>;
  list(options: { prefix?: string; cursor?: string; limit?: number }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
}

function getBucket(): R2BucketLike {
  const { env } = getCloudflareContext() as unknown as { env?: { STORAGE?: R2BucketLike } };
  if (!env?.STORAGE) throw new Error('R2 binding "STORAGE" is not defined');
  return env.STORAGE;
}

export async function uploadToStorage(key: string, body: ArrayBuffer | Blob, contentType: string) {
  await getBucket().put(key, body, { httpMetadata: { contentType } });
}

export async function deleteFromStorage(key: string) {
  await getBucket().delete(key);
}

/** Hapus semua objek dengan prefix tertentu. Mengembalikan jumlah objek terhapus. */
export async function deleteStoragePrefix(prefix: string) {
  const bucket = getBucket();
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 500 });
    const keys = page.objects.map((o) => o.key);
    if (keys.length > 0) {
      await bucket.delete(keys);
      deleted += keys.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
