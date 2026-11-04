// Deteksi wajah di browser (MediaPipe BlazeFace). Semua pemrosesan terjadi di HP; tidak ada gambar yang dikirim ke pihak lain.
// - Model (230 KB) disajikan dari public/models, bukan dari domain lain.
// - File WASM (sekitar 14 MB) dimuat dari CDN dan di-cache browser. Versinya harus sama dengan @mediapipe/tasks-vision di package.json.
import type { FaceDetector } from '@mediapipe/tasks-vision';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const MODEL_PATH = '/models/blaze_face_short_range.tflite';

export type ViewBox = { x: number; y: number; w: number; h: number };
export type VideoBox = { originX: number; originY: number; width: number; height: number };

export async function loadFaceDetector(): Promise<FaceDetector> {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const create = (delegate: 'GPU' | 'CPU') =>
    FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.6,
    });
  try {
    return await create('GPU');
  } catch {
    // Beberapa HP tidak mendukung GPU delegate
    return await create('CPU');
  }
}

/**
 * Ubah kotak wajah (koordinat piksel video asli) ke koordinat elemen <video> di layar.
 * 'contain': seluruh frame terlihat (ada bidang hitam di sisi lain). 'cover': frame dipotong agar memenuhi elemen.
 */
export function mapBoxToView(
  b: VideoBox, videoW: number, videoH: number, viewW: number, viewH: number, fit: 'contain' | 'cover' = 'cover',
): ViewBox {
  const scale = (fit === 'contain' ? Math.min : Math.max)(viewW / videoW, viewH / videoH);
  const offX = (viewW - videoW * scale) / 2;
  const offY = (viewH - videoH * scale) / 2;
  return { x: b.originX * scale + offX, y: b.originY * scale + offY, w: b.width * scale, h: b.height * scale };
}

/**
 * Wajah dianggap siap difoto bila cukup besar (tidak terlalu jauh) dan berada di area tengah frame.
 */
export function isFaceReady(b: VideoBox, videoW: number, videoH: number): boolean {
  if (b.width < videoW * 0.2) return false;
  const cx = (b.originX + b.width / 2) / videoW;
  const cy = (b.originY + b.height / 2) / videoH;
  return cx > 0.2 && cx < 0.8 && cy > 0.15 && cy < 0.85;
}
