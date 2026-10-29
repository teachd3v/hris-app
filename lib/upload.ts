// Validasi unggahan: ukuran, tipe sebenarnya (magic bytes), dan ekstensi aman.
// Tipe & ekstensi tidak pernah diambil dari klien.
export type UploadKind = 'jpeg' | 'png' | 'webp' | 'pdf';

const KIND_META: Record<UploadKind, { contentType: string; ext: string }> = {
  jpeg: { contentType: 'image/jpeg', ext: 'jpg' },
  png: { contentType: 'image/png', ext: 'png' },
  webp: { contentType: 'image/webp', ext: 'webp' },
  pdf: { contentType: 'application/pdf', ext: 'pdf' },
};

export const IMAGE_KINDS: UploadKind[] = ['jpeg', 'png', 'webp'];
export const DOCUMENT_KINDS: UploadKind[] = ['pdf', 'jpeg', 'png', 'webp'];

export const MB = 1024 * 1024;

function sniff(b: Uint8Array): UploadKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return 'pdf';
  return null;
}

const LABEL: Record<UploadKind, string> = { jpeg: 'JPG', png: 'PNG', webp: 'WEBP', pdf: 'PDF' };

export type UploadResult =
  | { ok: true; buffer: ArrayBuffer; contentType: string; ext: string; size: number }
  | { ok: false; error: string };

export async function validateUpload(
  file: Blob,
  opts: { maxBytes: number; kinds: UploadKind[]; name?: string },
): Promise<UploadResult> {
  const who = opts.name ? `"${opts.name}"` : 'File';
  const allowed = opts.kinds.map((k) => LABEL[k]).join(', ');
  if (file.size === 0) return { ok: false, error: `${who} kosong` };
  if (file.size > opts.maxBytes) {
    return { ok: false, error: `${who} terlalu besar (maks. ${Math.round(opts.maxBytes / MB)} MB)` };
  }
  const buffer = await file.arrayBuffer();
  const kind = sniff(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)));
  if (!kind || !opts.kinds.includes(kind)) {
    return { ok: false, error: `${who} harus berformat ${allowed}` };
  }
  return { ok: true, buffer, size: file.size, ...KIND_META[kind] };
}
