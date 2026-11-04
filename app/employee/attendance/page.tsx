'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAttendanceData, submitAttendance } from './actions';
import { Camera, Clock, CheckCircle, AlertCircle, Loader2, Navigation2, Smartphone, Lock, ShieldAlert } from 'lucide-react';
import { getDistanceFromLatLonInKm, OFFICE_LAT, OFFICE_LNG, MAX_RADIUS_KM } from '@/lib/geo';
import { loadFaceDetector, mapBoxToView, isFaceReady, type ViewBox } from '@/lib/face-detector';
import type { FaceDetector } from '@mediapipe/tasks-vision';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import DashboardLayout from '@/components/common/DashboardLayout';
import { EMPLOYEE_MENU } from '@/lib/navigation';

const CAPTURE_DELAY_MS = 3000;

export default function AttendancePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: 'in' | 'out'; time: string } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [justClockedIn, setJustClockedIn] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Alur: detecting (cari wajah) -> countdown 3 detik -> review (konfirmasi foto) -> kirim
  const [phase, setPhase] = useState<'detecting' | 'review'>('detecting');
  const [detectorState, setDetectorState] = useState<'loading' | 'ready' | 'unsupported'>('loading');
  const [faceBox, setFaceBox] = useState<ViewBox | null>(null);
  const [captureIn, setCaptureIn] = useState<number | null>(null);
  const [captured, setCaptured] = useState<{ blob: Blob; url: string } | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const readySinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (successModal?.isOpen) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setSuccessModal(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [successModal?.isOpen]);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, []);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAttendanceData();
      if (res.error) {
        if (res.error === 'Not authenticated') router.push('/');
        return;
      }
      setEmployee(res.employee);
      setAttendanceToday(res.attendanceToday);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const formatDuration = (hours: number | null | undefined) => {
    if (!hours) return '0 jam 0 menit';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} jam ${m} menit`;
  };

  const formatTimeStr = (isoString: string | null | undefined) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("PWA/Browser tidak mendukung akses kamera langsung. Pastikan koneksi aman (HTTPS).");
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let stream: MediaStream;
      try {
        // Minta rasio 3:4 (potret), yang di kebanyakan HP adalah bidang pandang penuh sensor kamera depan.
        // Rasio 16:9 atau mengikuti layar 9:20 biasanya memotong sensor sehingga wajah terlihat lebih besar.
        const portrait = window.innerHeight >= window.innerWidth;
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: portrait ? 960 : 1280 },
            height: { ideal: portrait ? 1280 : 960 },
            aspectRatio: { ideal: portrait ? 3 / 4 : 4 / 3 },
          },
        });
      } catch (firstErr) {
        console.warn("Failed with facingMode constraint, retrying with generic video constraint...", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      // Bila kamera mendukung zoom, pastikan di posisi paling lebar (1x)
      try {
        const track = stream.getVideoTracks()[0];
        const zoom = (track.getCapabilities?.() as any)?.zoom;
        if (zoom && typeof zoom.min === 'number') {
          await track.applyConstraints({ advanced: [{ zoom: zoom.min } as any] });
        }
        if (new URLSearchParams(window.location.search).has('debug')) {
          const st = track.getSettings() as any;
          setDebugInfo(`${st.width}x${st.height} zoom:${st.zoom ?? '-'} ${JSON.stringify((track.getCapabilities?.() as any)?.zoom ?? null)}`);
        }
      } catch (e) {
        console.warn('Zoom kamera tidak dapat diatur', e);
      }

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
        const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);
        if (isStandalone) {
          setCameraError("Izin kamera ditolak. Karena dibuka via PWA, izin mengikuti browser induk: \n• Android: Buka Pengaturan HP > Aplikasi > Chrome > Izin > Aktifkan Kamera. \n• iOS (iPhone): Buka Pengaturan HP > Safari > Kamera > Pilih Izinkan / Tanya.");
        } else {
          setCameraError("Izin kamera ditolak oleh browser. Silakan klik ikon gembok di sebelah URL situs pada bilah alamat browser Anda, lalu aktifkan izin kamera untuk situs ini secara manual.");
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Kamera fisik tidak ditemukan pada perangkat Anda. Pastikan webcam terpasang dan terdeteksi oleh sistem.");
      } else {
        setCameraError(err.message || "Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan.");
      }
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setFaceBox(null);
  };

  useEffect(() => {
    if (isMounted && attendanceToday !== undefined) {
      const clockedOut = attendanceToday?.clock_out != null;
      if (!clockedOut && !justClockedIn) {
        startCamera();
      } else {
        stopCamera();
      }
    }
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, [isMounted, attendanceToday, justClockedIn]);

  // Muat model deteksi wajah sekali. Bila gagal (jaringan/perangkat), tombol "Ambil Foto" manual jadi cadangan.
  useEffect(() => {
    let cancelled = false;
    loadFaceDetector()
      .then((d) => {
        if (cancelled) return d.close();
        detectorRef.current = d;
        setDetectorState('ready');
      })
      .catch((e) => {
        console.error('Face detector gagal dimuat', e);
        if (!cancelled) setDetectorState('unsupported');
      });
    return () => {
      cancelled = true;
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          
          const dist = getDistanceFromLatLonInKm(lat, lng, OFFICE_LAT, OFFICE_LNG);
          setDistance(dist);
          setLocationError('');
        },
        (error) => {
          console.error(error);
          setLocationError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError('Geolocation tidak didukung di perangkat ini.');
    }
  }, []);

  const takePhoto = (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current) return Promise.resolve(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Potong ke rasio 3:4 di tengah frame, sama dengan yang terlihat di kotak kamera
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const target = 3 / 4;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (vw / vh > target) { sw = vh * target; sx = (vw - sw) / 2; }
    else { sh = vw / target; sy = (vh - sh) / 2; }
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    
    // Foto dicerminkan agar sama dengan pratinjau
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    }); 
  };

  const capturePhoto = useCallback(async () => {
    const blob = await takePhoto();
    if (!blob) {
      alert('Gagal mengambil foto, silakan coba lagi.');
      return;
    }
    readySinceRef.current = null;
    setCaptureIn(null);
    setFaceBox(null);
    setCaptured({ blob, url: URL.createObjectURL(blob) });
    setPhase('review');
  }, []);

  const retakePhoto = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    readySinceRef.current = null;
    setPhase('detecting');
  };

  // Loop deteksi: gambar kotak kuning pada wajah, lalu hitung mundur 3 detik selama wajah siap, lalu ambil foto otomatis
  useEffect(() => {
    const active = phase === 'detecting' && streamActive && detectorState === 'ready';
    if (!active) return;
    readySinceRef.current = null;
    let raf = 0;
    let lastTick = 0;
    let lastVideoTime = -1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastTick < 100) return; // ~10 kali per detik
      lastTick = now;
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2 || !video.videoWidth || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;

      const faces = detector.detectForVideo(video, performance.now()).detections;
      // Pakai wajah terbesar (yang paling dekat kamera)
      const best = faces
        .map((d) => d.boundingBox)
        .filter((b): b is NonNullable<typeof b> => Boolean(b))
        .sort((a, b) => b.width * b.height - a.width * a.height)[0];

      if (!best) {
        setFaceBox(null);
        setCaptureIn(null);
        readySinceRef.current = null;
        return;
      }
      const box = mapBoxToView(best, video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, 'cover');
      // Video dicerminkan, jadi kotak ikut dibalik kiri-kanan
      setFaceBox({ ...box, x: video.clientWidth - box.x - box.w });
      const ready = isFaceReady(best, video.videoWidth, video.videoHeight);
      if (!ready) {
        setCaptureIn(null);
        readySinceRef.current = null;
        return;
      }
      if (readySinceRef.current == null) readySinceRef.current = now;
      const elapsed = now - readySinceRef.current;
      if (elapsed >= CAPTURE_DELAY_MS) {
        cancelAnimationFrame(raf);
        capturePhoto();
        return;
      }
      setCaptureIn(Math.ceil((CAPTURE_DELAY_MS - elapsed) / 1000));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, streamActive, detectorState, capturePhoto]);

  // Bersihkan URL foto bila halaman ditutup
  useEffect(() => () => { if (captured) URL.revokeObjectURL(captured.url); }, [captured]);

  const handleAttendance = async (type: 'in' | 'out') => {
    if (!employee || !captured) return;
    setIsSubmitting(true);
    try {
      const blob = captured.blob;

      const formData = new FormData();
      formData.append('file', blob);
      formData.append('lat', location?.lat?.toString() || '0');
      formData.append('lng', location?.lng?.toString() || '0');

      const res = await submitAttendance(type, formData);
      if (res.error) throw new Error(res.error);

      if (type === 'in') {
        setJustClockedIn(true);
      }
      setCaptured(null);
      setPhase('detecting');
      
      const now = new Date().toISOString();

      await fetchAttendance();
      const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setSuccessModal({ isOpen: true, type, time: timeStr });
    } catch (error: any) {
      console.error(error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocationValid = distance !== null && distance <= MAX_RADIUS_KM;
  const hasClockedIn = attendanceToday?.clock_in != null;
  const hasClockedOut = attendanceToday?.clock_out != null;

  return (
    <DashboardLayout
      role="Karyawan"
      userName={employee?.name || 'Memuat...'}
      userInitials={employee?.name ? employee.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
      userPhoto={employee?.photo_url}
      hideTopbar={true}
      hideBottomNav={true}
      noPadding={true}
      menuSections={EMPLOYEE_MENU}
    >
      {/* DESKTOP LOCKED SCREEN (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col items-center justify-center py-6 px-4 text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-8 border border-[var(--line)] w-full flex flex-col items-center relative overflow-hidden">
          
          {/* Decorative Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-100/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl pointer-events-none"></div>

          {/* Locked Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600 text-[11px] font-black tracking-wider uppercase mb-6">
            <Lock size={14} strokeWidth={2.5} />
            Khusus Perangkat Mobile
          </div>

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-50 to-red-100 text-[var(--red)] flex items-center justify-center mb-6 shadow-inner border border-red-200/50">
            <Smartphone size={40} strokeWidth={2} />
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl font-black text-[var(--ink)] tracking-tight mb-2">
            Presensi Wajib via Mobile / HP
          </h2>
          <p className="text-[14px] text-[var(--ink-3)] max-w-md leading-relaxed mb-8">
            Demi keamanan verifikasi lokasi GPS & swafoto, presensi masuk dan keluar <span className="font-bold text-[var(--ink)]">hanya dapat dilakukan melalui HP / Smartphone</span>.
          </p>

          {/* Today's Status Box */}
          <div className="w-full bg-[var(--bg)] rounded-2xl p-4 border border-[var(--line)] mb-8 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider block mb-0.5">Status Hari Ini</span>
              <span className="text-[14px] font-bold text-[var(--ink)]">
                {hasClockedOut 
                  ? "Selesai (Sudah Clock Out)" 
                  : hasClockedIn 
                  ? `Sudah Clock In (${formatTimeStr(attendanceToday?.clock_in)})` 
                  : "Belum Absen Hari Ini"}
              </span>
            </div>
            {hasClockedIn ? (
              <span className="px-3 py-1 bg-green-50 text-green-700 font-extrabold text-[12px] rounded-full border border-green-200 flex items-center gap-1">
                <CheckCircle size={14} /> Terverifikasi
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-[12px] rounded-full border border-amber-200 flex items-center gap-1">
                <Clock size={14} /> Menunggu Absen
              </span>
            )}
          </div>

          {/* Instruction Steps */}
          <div className="w-full text-left bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-slate-200/60 mb-8">
            <h3 className="text-[13px] font-black text-[var(--ink)] mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-[var(--red)]" /> Cara Melakukan Presensi:
            </h3>
            <ol className="text-[12px] text-[var(--ink-3)] space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--red-soft)] text-[var(--red)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                Buka browser di HP Anda lalu kunjungi <strong className="text-[var(--ink)]">hrteach.site</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--red-soft)] text-[var(--red)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                Izinkan akses Kamera & Lokasi (GPS) saat diminta di browser HP.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--red-soft)] text-[var(--red)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                Klik tombol <strong>Presensi</strong> di bagian navigasi bawah HP Anda.
              </li>
            </ol>
          </div>

          {/* Back button */}
          <Link href="/employee/attendance/history" className="mb-3 w-full flex items-center justify-center gap-2 h-12 rounded-full border border-[var(--red)] text-[var(--red)] font-bold text-[14px] hover:bg-red-50 transition-colors">
            <Clock size={16} /> Lihat Riwayat Presensi
          </Link>
          <button
            onClick={() => router.push('/employee/dashboard')}
            className="px-6 py-3 rounded-full bg-[var(--ink)] text-white font-bold text-[13px] hover:bg-black transition-all active:scale-95 shadow-md flex items-center gap-2"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* MOBILE CONTAINER (Visible only on Mobile screens < md) */}
      <div className="w-full min-h-screen md:hidden relative flex flex-col pb-6 bg-white text-[var(--ink)]">
        
        {/* Kotak kamera potret 3:4, di tengah antara header dan grup bawah */}
        <div className="absolute inset-x-0 top-[140px] bottom-[130px] z-0 flex items-center justify-center pointer-events-none">
        <div
          className={`relative overflow-hidden rounded-[20px] bg-black shadow-md pointer-events-auto ${hasClockedOut || justClockedIn ? 'hidden' : ''}`}
          style={{ height: 'min(100%, calc((100vw - 24px) * 4 / 3))', aspectRatio: '3 / 4' }}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ transform: 'scaleX(-1)' }} /* cermin seperti kamera selfie bawaan */
            className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {debugInfo && (
            <div className="absolute left-2 top-1/2 z-10 text-[10px] text-yellow-300 bg-black/60 px-2 py-1 rounded">{debugInfo}</div>
          )}

          {/* Kotak kuning mengikuti wajah secara real-time */}
          {faceBox && phase === 'detecting' && (
            <div
              data-testid="face-box"
              className="absolute pointer-events-none rounded-xl border-[3px] border-yellow-400 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{ left: faceBox.x, top: faceBox.y, width: faceBox.w, height: faceBox.h }}
            />
          )}
        </div>
        </div>

        {/* UI Overlay */}
        <div className="flex flex-col justify-between flex-1 p-6 z-10 h-full">
          
          {/* Top Section */}
          <div>
            {/* Header Title */}
            <div className="flex justify-between items-center w-full mb-3">
              <div>
                {!isLoading && !hasClockedOut && !justClockedIn && (
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 border border-black/10 text-black text-[11px] font-black uppercase tracking-wider">
                    {hasClockedIn ? 'Clock Out' : 'Clock In'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
              <Link href="/employee/attendance/history" aria-label="Riwayat presensi" className="h-8 px-3 flex justify-center items-center gap-1 rounded-full bg-gray-100 border border-black/10 shadow-sm text-black text-[11px] font-bold"><Clock size={12} /> Riwayat</Link>
              <button onClick={() => router.back()} className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-100 border border-black/10 shadow-sm hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              </div>
            </div>

            {/* Employee Info Block */}
            <div className="flex items-center justify-between gap-3 w-full bg-white px-3 py-2 rounded-[14px] shadow-sm border border-black/10">
               {/* Kiri: profil */}
               <div className="flex items-center gap-2 min-w-0 flex-1">
                 <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[13px] text-black shadow-inner">
                    {employee?.photo_url ? (
                       <img src={employee.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       employee?.name?.charAt(0).toUpperCase() || '?'
                    )}
                 </div>
                 <div className="min-w-0">
                    <p className="font-bold text-[12px] leading-tight text-black truncate">{employee?.name || 'Memuat data...'}</p>
                    <p className="text-[10px] leading-tight text-black/60 truncate mt-0.5">{employee?.title || 'Karyawan'} • {employee?.dept || '-'}</p>
                 </div>
               </div>
               {/* Kanan: tanggal dan jam presensi (hanya saat belum selesai presensi) */}
               {!hasClockedOut && !justClockedIn && !isLoading && (
                 <div className="text-right shrink-0 border-l border-black/10 pl-3">
                   <p className="text-[9px] leading-tight font-bold uppercase tracking-wide text-black/60">
                     {isMounted ? currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Memuat...'}
                   </p>
                   <p className="text-[17px] leading-tight font-black tracking-tight text-black tabular-nums mt-0.5">
                     {isMounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00.00.00'}
                   </p>
                 </div>
               )}
            </div>
          </div>

          {/* Center Section (Time & Status) */}
          <div className="flex flex-col items-center justify-center flex-1 my-6 relative">
        {/* Camera Viewfinder / Summary Dashboard */}
        {isLoading ? (
          <div className="w-full h-[420px] rounded-[var(--radius-hris-xl)] flex flex-col justify-center items-center bg-white/50 border border-[var(--glass-border)] animate-pulse mb-6">
            <Loader2 className="animate-spin text-[var(--ink-3)] mb-2" size={32} />
            <span className="text-sm font-medium text-[var(--ink-3)]">Memuat status presensi...</span>
          </div>
        ) : hasClockedOut ? (
          /* Premium Clock Out Summary Dashboard */
          <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-[28px] shadow-[0_12px_30px_rgba(0,0,0,0.04)] border border-[var(--glass-border)] mb-6 flex flex-col gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div>
              <div className="w-16 h-16 bg-[var(--blue-soft)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-[var(--blue)]/20">
                <CheckCircle size={32} className="text-[var(--blue)]" />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--ink)]">Presensi Hari Ini Lengkap!</h3>
              <p className="text-[13px] text-[var(--ink-3)] mt-1">Terima kasih atas kontribusi dan dedikasi Anda hari ini.</p>
            </div>

            {/* Circular Progress & Working Duration */}
            <div className="bg-gradient-to-br from-[var(--bg)] to-white p-5 rounded-2xl border border-[var(--line)] shadow-sm flex flex-col items-center">
              <span className="text-[11px] font-bold tracking-widest text-[var(--ink-3)] uppercase">TOTAL DURASI KERJA</span>
              <span className="text-[28px] font-black text-[var(--ink)] mt-1 tracking-tight">
                {formatDuration(attendanceToday?.duration_hours)}
              </span>
              
              {/* Custom Mini Progress Bar representing 8 Hours standard */}
              <div className="w-full bg-black/5 h-2 rounded-full mt-4 overflow-hidden relative">
                <div 
                  className="bg-gradient-to-r from-[var(--red)] to-[var(--green)] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((attendanceToday?.duration_hours || 0) / 8) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-[var(--ink-4)] mt-2 font-medium">
                {attendanceToday?.duration_hours && attendanceToday.duration_hours >= 8 
                  ? '🎯 Target jam kerja terpenuhi' 
                  : `⚠️ Kurang ${(8 - Math.min(8, attendanceToday?.duration_hours || 0)).toFixed(1)} jam dari standar 8 jam`}
              </span>
            </div>

            {/* Clock In / Out Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Clock In Card */}
              <div className="p-3.5 bg-white rounded-xl border border-[var(--line)] shadow-sm flex flex-col items-center text-center w-full">
                <span className="text-[11px] font-bold text-[var(--green)] uppercase tracking-wider mb-2">Clock In</span>
                {attendanceToday?.clock_in_photo_url ? (
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 border border-black/5 relative group">
                    <img src={attendanceToday.clock_in_photo_url} alt="Selfie In" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-lg bg-[var(--surface-item)] flex items-center justify-center mb-2">
                    <Camera size={20} className="text-[var(--ink-4)]" />
                  </div>
                )}
                <span className="text-[18px] font-black text-[var(--ink)]">{formatTimeStr(attendanceToday?.clock_in)}</span>
                <span className="text-[11px] text-[var(--green)] font-semibold mt-0.5">Terverifikasi</span>
              </div>

              {/* Clock Out Card */}
              <div className="p-3.5 bg-white rounded-xl border border-[var(--line)] shadow-sm flex flex-col items-center text-center w-full">
                <span className="text-[11px] font-bold text-[var(--blue)] uppercase tracking-wider mb-2">Clock Out</span>
                {attendanceToday?.clock_out_photo_url ? (
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 border border-black/5 relative group">
                    <img src={attendanceToday.clock_out_photo_url} alt="Selfie Out" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-lg bg-[var(--surface-item)] flex items-center justify-center mb-2">
                    <Camera size={20} className="text-[var(--ink-4)]" />
                  </div>
                )}
                <span className="text-[18px] font-black text-[var(--ink)]">{formatTimeStr(attendanceToday?.clock_out)}</span>
                <span className="text-[11px] text-[var(--blue)] font-semibold mt-0.5">Terverifikasi</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/employee/dashboard')}
              className="w-full h-13 rounded-full font-bold text-[14px] text-white shadow-md transition-all active:scale-95 bg-[var(--ink)] flex items-center justify-center gap-2 hover:bg-black"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : justClockedIn ? (
          /* Premium Clock In Summary Dashboard */
          <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-[28px] shadow-[0_12px_30px_rgba(0,0,0,0.04)] border border-[var(--glass-border)] mb-6 flex flex-col gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-[var(--green-soft)] rounded-full flex items-center justify-center shadow-inner border border-[var(--green)]/20">
                <CheckCircle size={22} className="text-[var(--green)]" />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--ink)]">Clock In Berhasil</h3>
            </div>

            {/* Clock In Info Card */}
            <div className="p-4 bg-gradient-to-br from-[var(--bg)] to-white rounded-2xl border border-[var(--line)] shadow-sm flex flex-col items-center w-full">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-[11px] font-bold tracking-widest text-[var(--green)] uppercase">Waktu Masuk</span>
                <span className="text-[32px] leading-none font-black text-[var(--ink)] tracking-tight">
                  {formatTimeStr(attendanceToday?.clock_in)}
                </span>
              </div>
              
              {attendanceToday?.clock_in_photo_url && (
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mt-3 border border-black/5 shadow-sm">
                  <img src={attendanceToday.clock_in_photo_url} alt="Selfie In" className="w-full h-full object-cover" />
                </div>
              )}
              
              <span className="text-[11px] text-[var(--green)] font-semibold mt-3 flex items-center gap-1">
                <CheckCircle size={12} className="text-[var(--green)]" /> Terverifikasi
              </span>
            </div>

            <button
              onClick={() => router.push('/employee/dashboard')}
              className="w-full h-13 rounded-full font-bold text-[14px] text-white shadow-md transition-all active:scale-95 bg-[var(--ink)] flex items-center justify-center gap-2 hover:bg-black"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <>
            {/* Error or Loading overlays for camera */}
            {!streamActive && !hasClockedOut && !justClockedIn && (
              cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-center z-20">
                  <div className="bg-white p-6 rounded-[24px] border border-red-200 shadow-lg">
                    <AlertCircle className="text-[var(--red)] mb-3 mx-auto" size={48} />
                    <span className="text-[16px] font-bold text-black block">Akses Kamera Gagal</span>
                    <span className="text-[12px] text-black/60 mt-2 mb-6 px-4 block">
                      {cameraError}
                    </span>
                    <button 
                      onClick={() => startCamera()} 
                      className="px-6 py-2.5 rounded-full bg-[var(--red)] text-white font-bold text-[13px] hover:bg-red-700 transition-all active:scale-95 shadow-md"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-center z-20">
                  <div className="bg-white p-6 rounded-[24px] border border-black/10 shadow-lg">
                    <Loader2 className="animate-spin text-black mb-3 mx-auto" size={36} />
                    <span className="text-[15px] font-bold text-black block">Mempersiapkan Presensi</span>
                    <span className="text-[12px] text-black/60 mt-1 block">Mengakses kamera & GPS...</span>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

          {/* Bottom Section (Location & Button) */}
          <div className="mt-auto">
             {!hasClockedOut && !justClockedIn && (
               /* Satu grup menempel di dasar layar: info lokasi + status deteksi wajah */
               <div className="fixed bottom-0 inset-x-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
               <div className="flex flex-col gap-2 bg-white p-2.5 rounded-[20px] border border-black/10 shadow-[0_-6px_24px_rgba(0,0,0,0.10)]">
                 {/* Info lokasi */}
                 <div className="px-1.5 pt-0.5 text-[12px] flex items-center gap-2.5">
                   {locationError ? (
                     <AlertCircle className="text-[var(--red)] shrink-0" size={20} />
                   ) : isLocationValid ? (
                     <CheckCircle className="text-[var(--green)] shrink-0" size={20} />
                   ) : (
                     <Navigation2 className="text-[var(--yellow)] shrink-0" size={20} />
                   )}
                   
                   <div className="flex-1 min-w-0">
                     <p className="font-semibold text-[12px] leading-tight truncate text-black flex items-center gap-1.5">
                       {locationError ? 'Gagal mendapatkan lokasi' : 'Lokasi Terdeteksi'}
                       <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[var(--yellow)] text-black uppercase shrink-0">
                         Uji Coba
                       </span>
                     </p>
                     <p className={`truncate text-[11px] leading-tight mt-0.5 font-medium ${isLocationValid ? 'text-[var(--green)]' : 'text-black/60'}`}>
                       {locationError ? (
                         'GPS tidak aktif/error • Tetap bisa absen'
                       ) : distance === null ? (
                         'Menghitung jarak...' 
                       ) : isLocationValid ? (
                         `Dalam radius kantor (${(distance * 1000).toFixed(0)}m)` 
                       ) : (
                         `Luar radius (${(distance * 1000).toFixed(0)}m) • Tetap bisa absen`
                       )}
                     </p>
                   </div>
                 </div>

                 {/* Tombol status dinamis: foto diambil otomatis saat wajah terdeteksi */}
                 {detectorState === 'unsupported' ? (
                   <button
                     disabled={!streamActive}
                     onClick={capturePhoto}
                     className="w-full h-12 rounded-full font-bold text-[14px] transition-all duration-300 active:scale-95 flex justify-center items-center gap-2 bg-[var(--red)] text-white hover:bg-red-700 disabled:opacity-50"
                   >
                     Ambil Foto <Camera size={18} strokeWidth={2.5} />
                   </button>
                 ) : (
                   <button
                     disabled
                     data-testid="detect-status"
                     className={`w-full h-12 rounded-full font-bold text-[14px] flex justify-center items-center gap-2 border ${
                       captureIn != null ? 'bg-[var(--green)] text-white border-transparent' : 'bg-gray-100 text-black border-black/10'
                     }`}
                   >
                     {captureIn != null ? (
                       <>Tahan posisi… {captureIn}</>
                     ) : detectorState === 'loading' ? (
                       <><Loader2 className="animate-spin" size={16} /> Menyiapkan deteksi wajah...</>
                     ) : faceBox ? (
                       <>Posisikan wajah di tengah layar</>
                     ) : (
                       <><Loader2 className="animate-spin" size={16} /> Mendeteksi wajah...</>
                     )}
                   </button>
                 )}
               </div>
               </div>
             )}
          </div>
        </div>

      </div>

      {/* Layar konfirmasi foto (HP): Ulangi atau Setujui */}
      {captured && phase === 'review' && (
        <div data-testid="review-screen" className="md:hidden fixed inset-0 z-[60] bg-white text-black flex flex-col">
          <div className="relative z-10 flex flex-col justify-between h-full p-6">
            <div className="mt-2">
              <h2 className="text-2xl font-bold tracking-tight text-black">Konfirmasi Foto</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-gray-100 border border-black/10 text-black text-[11px] font-black uppercase tracking-wider">
                {hasClockedIn ? 'Clock Out' : 'Clock In'}
              </span>
            </div>
            <div className="flex items-center justify-center flex-1 py-3 min-h-0">
              <img
                src={captured.url}
                alt="Hasil foto presensi"
                className="rounded-[20px] shadow-md bg-black object-cover"
                style={{ maxHeight: '100%', maxWidth: '100%', aspectRatio: '3 / 4' }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => handleAttendance(hasClockedIn ? 'out' : 'in')}
                className="w-full h-14 rounded-full font-bold text-[16px] shadow-xl flex justify-center items-center gap-2 bg-[var(--red)] text-white active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Lanjut / Setujui Presensi <CheckCircle size={20} strokeWidth={2.5} /></>}
              </button>
              <button
                disabled={isSubmitting}
                onClick={retakePhoto}
                className="w-full h-12 rounded-full font-bold text-[14px] bg-gray-100 border border-black/10 text-black active:scale-95 transition-transform disabled:opacity-50"
              >
                Ulangi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
            <div className={`p-8 text-center text-white relative ${successModal.type === 'in' ? 'bg-[var(--green)]' : 'bg-[var(--blue)]'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5 backdrop-blur-md shadow-inner border border-white/30 relative z-10">
                <CheckCircle size={40} strokeWidth={2.5} className="text-white" />
              </div>
              <h2 className="text-[28px] font-black tracking-tight mb-1 relative z-10">
                Berhasil Clock {successModal.type === 'in' ? 'In' : 'Out'}!
              </h2>
              <p className="text-white/90 text-[14px] font-medium relative z-10">
                Data presensi Anda telah tersimpan di sistem.
              </p>
            </div>
            
            <div className="p-8 text-center bg-[var(--bg)]">
              <p className="text-[12px] text-[var(--ink-3)] font-bold uppercase tracking-widest mb-2">
                Waktu Tersimpan
              </p>
              <div className="text-[56px] leading-none font-black text-[var(--ink)] tracking-tighter mb-4 drop-shadow-sm">
                {successModal.time}
              </div>
              
              {successModal.type === 'out' && attendanceToday?.duration_hours && (
                <div className="mb-6 p-3 bg-white rounded-xl border border-[var(--line)] text-center text-[13px] font-semibold text-[var(--ink-2)]">
                  Total jam kerja hari ini: <span className="text-[var(--ink)] font-extrabold">{formatDuration(attendanceToday.duration_hours)}</span>
                </div>
              )}
              
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full h-14 rounded-full font-bold text-[15px] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] transition-all active:scale-95 hover:scale-[1.02] bg-[var(--ink)] hover:bg-black"
              >
                Tutup ({countdown}s)
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
