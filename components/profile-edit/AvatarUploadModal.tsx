"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Upload, Check } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface AvatarUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (croppedImageBase64: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // As Base64 string
  return canvas.toDataURL("image/jpeg");
}

export default function AvatarUploadModal({ open, onClose, onSave }: AvatarUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedImage) {
        onSave(croppedImage);
        setImageSrc(null); // reset
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels, onClose, onSave]);

  const handleClose = () => {
    setImageSrc(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-ink">Ubah Foto Profil</h2>
            <p className="text-sm text-ink-3">Pilih dan sesuaikan foto profil Anda.</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-line-2 text-ink-3 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!imageSrc ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-line-2 rounded-xl bg-white hover:bg-line/30 hover:border-ink-3 transition-colors group">
              <Upload size={32} className="text-ink-3 mb-3 group-hover:text-ink transition-colors" />
              <p className="text-sm text-ink font-medium">Pilih gambar</p>
              <p className="text-xs text-ink-3 mt-1 text-center">Format JPEG atau PNG, maks 5MB.</p>
              <label className="mt-4 px-4 py-2 bg-ink text-white rounded-full text-sm font-semibold cursor-pointer hover:bg-ink-2 transition-colors">
                Jelajahi File
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-[300px] bg-ink rounded-xl overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div>
                <label className="text-sm text-ink-2 font-medium mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-line-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line flex justify-end gap-2 bg-line/20">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink-2 hover:bg-white border border-line-2 transition-colors"
          >
            Batal
          </button>
          {imageSrc && (
            <button
              onClick={showCroppedImage}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--red)] hover:bg-[var(--red-hover)] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Check size={16} />
              Simpan Foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
