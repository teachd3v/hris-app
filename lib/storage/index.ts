import { AwsClient } from "aws4fetch";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const BUCKET_NAME = "hris-teachapp-storage";

export function getStorageClient() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials in environment variables");
  }

  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

export async function uploadToStorage(key: string, buffer: Buffer | ArrayBuffer | Blob, contentType: string) {
  try {
    const { env } = getCloudflareContext() as any;
    if (env?.STORAGE) {
      await env.STORAGE.put(key, buffer, {
        httpMetadata: { contentType }
      });
      return;
    }
  } catch (e) {
    console.warn("Native R2 binding env.STORAGE not available, attempting S3 API fallback...", e);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const aws = getStorageClient();
  const url = `https://${accountId}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
  
  const response = await aws.fetch(url, {
    method: 'PUT',
    body: buffer as any,
    headers: {
      'Content-Type': contentType
    }
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  return response;
}

export async function deleteFromStorage(key: string) {
  try {
    const { env } = getCloudflareContext() as any;
    if (env?.STORAGE) {
      await env.STORAGE.delete(key);
      return;
    }
  } catch (e) {
    console.warn("Native R2 binding env.STORAGE not available, attempting S3 API fallback...", e);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const aws = getStorageClient();
  const url = `https://${accountId}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
  
  const response = await aws.fetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
  return response;
}

/** Hapus semua objek dengan prefix tertentu lewat binding R2. Mengembalikan jumlah objek terhapus. */
export async function deleteStoragePrefix(prefix: string) {
  const { env } = getCloudflareContext() as any;
  if (!env?.STORAGE) throw new Error("Native R2 binding env.STORAGE not available");

  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await env.STORAGE.list({ prefix, cursor, limit: 500 });
    const keys: string[] = page.objects.map((o: { key: string }) => o.key);
    if (keys.length > 0) {
      await env.STORAGE.delete(keys);
      deleted += keys.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
