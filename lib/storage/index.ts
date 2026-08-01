import { AwsClient } from "aws4fetch";

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

export async function uploadToStorage(key: string, buffer: Buffer | ArrayBuffer, contentType: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const aws = getStorageClient();
  const url = `https://${accountId}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
  
  const response = await aws.fetch(url, {
    method: 'PUT',
    body: buffer,
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
