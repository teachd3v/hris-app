'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Camera, Clock, CheckCircle, AlertCircle, Loader2, Navigation2 } from 'lucide-react';
import { getDistanceFromLatLonInKm } from '@/lib/geo';
import { useRouter } from 'next/navigation';

const OFFICE_LAT = -6.4733643;
const OFFICE_LNG = 106.7274949;
const MAX_RADIUS_KM = 1.0;

export default function AttendancePage() {
  const router = useRouter();
  const supabase = createClient();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setEmployee(empData);

      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await (supabase as any)
        .from('attendances')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .maybeSingle() as any;
      
      setAttendanceToday(attData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

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
    try {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setLocationError("Kamera tidak dapat diakses.");
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
  };

  useEffect(() => {
    if (isMounted && attendanceToday !== undefined) {
      const clockedOut = attendanceToday?.clock_out != null;
      if (!clockedOut && !justClockedIn && !isSubmitting) {
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
  }, [isMounted, attendanceToday, justClockedIn, isSubmitting]);

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
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    }); 
  };

  const handleAttendance = async (type: 'in' | 'out') => {
    if (!employee) return;
    if (distance === null || distance > MAX_RADIUS_KM) {
      alert("Anda berada di luar jangkauan lokasi absen!");
      return;
    }

    setIsSubmitting(true);
    try {
      const blob: any = await takePhoto();
      if (!blob) throw new Error("Gagal mengambil foto");

      const fileName = `${employee.id}/${Date.now()}_${type}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendances')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('attendances')
        .getPublicUrl(fileName);

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      if (type === 'in') {
        const { error } = await (supabase as any).from('attendances').insert({
          employee_id: employee.id,
          date: today,
          clock_in: now,
          clock_in_lat: location?.lat,
          clock_in_lng: location?.lng,
          clock_in_photo_url: publicUrlData.publicUrl,
          status: 'PRESENT'
        });
        if (error) throw error;
        setJustClockedIn(true);
      } else {
        let durationHours = 0;
        if (attendanceToday?.clock_in) {
           const inTime = new Date(attendanceToday.clock_in).getTime();
           const outTime = new Date(now).getTime();
           durationHours = (outTime - inTime) / (1000 * 60 * 60);
        }

        const { error } = await (supabase as any).from('attendances')
          .update({
            clock_out: now,
            clock_out_lat: location?.lat,
            clock_out_lng: location?.lng,
            clock_out_photo_url: publicUrlData.publicUrl,
            duration_hours: durationHours
          })
          .eq('id', attendanceToday.id);
        if (error) throw error;
      }

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center py-8 px-4 font-jakarta relative overflow-hidden">
      {/* Background Ornaments from HRIS TEACH */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[var(--red-soft)] rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[var(--yellow-soft)] rounded-full mix-blend-multiply filter blur-[80px] opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        
        {/* Header Title */}
        <div className="flex justify-between items-center w-full mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Presensi Harian</h1>
          <button onClick={() => router.back()} className="w-8 h-8 flex justify-center items-center rounded-full bg-white/50 border border-[var(--glass-border)] shadow-sm hover:bg-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--ink)]"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </div>

        {/* Employee Info Block */}
        <div className="flex items-center justify-between w-full mb-6 mt-1 bg-white/80 backdrop-blur-md p-3.5 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[var(--glass-border)]">
          <div className="flex items-center gap-3 w-full">
             <div className="w-12 h-12 rounded-full bg-[var(--surface-item)] border border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center font-bold text-lg text-[var(--ink-3)] shadow-inner">
                {employee?.photo_url ? (
                   <img src={employee.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   employee?.name?.charAt(0).toUpperCase() || '?'
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-[var(--ink)] truncate">{employee?.name || 'Memuat data...'}</p>
                <p className="text-[12px] text-[var(--ink-3)] truncate mt-0.5">{employee?.title || 'Karyawan'} • {employee?.dept || '-'}</p>
             </div>
          </div>
        </div>

        {!hasClockedOut && (
          <>
            <p className="eyebrow mb-6 text-[var(--ink-3)]">
              {isMounted ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Memuat Tanggal...'}
            </p>

            <div className="text-[clamp(40px,10vw,64px)] font-black mb-8 tracking-tighter drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-[var(--red)] to-[var(--yellow)]">
              {isMounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00.00.00'}
            </div>
          </>
        )}

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
              <div className="p-3.5 bg-white rounded-xl border border-[var(--line)] shadow-sm flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-[var(--green)] uppercase tracking-wider mb-2">Clock In</span>
                {attendanceToday?.clock_in_photo_url ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 border border-black/5 relative group">
                    <img src={attendanceToday.clock_in_photo_url} alt="Selfie In" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[var(--surface-item)] flex items-center justify-center mb-2">
                    <Camera size={20} className="text-[var(--ink-4)]" />
                  </div>
                )}
                <span className="text-[18px] font-black text-[var(--ink)]">{formatTimeStr(attendanceToday?.clock_in)}</span>
                <span className="text-[11px] text-[var(--green)] font-semibold mt-0.5">Terverifikasi</span>
              </div>

              {/* Clock Out Card */}
              <div className="p-3.5 bg-white rounded-xl border border-[var(--line)] shadow-sm flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-[var(--blue)] uppercase tracking-wider mb-2">Clock Out</span>
                {attendanceToday?.clock_out_photo_url ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 border border-black/5 relative group">
                    <img src={attendanceToday.clock_out_photo_url} alt="Selfie Out" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[var(--surface-item)] flex items-center justify-center mb-2">
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
            <div>
              <div className="w-16 h-16 bg-[var(--green-soft)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-[var(--green)]/20">
                <CheckCircle size={32} className="text-[var(--green)]" />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--ink)]">Clock In Berhasil!</h3>
              <p className="text-[13px] text-[var(--ink-3)] mt-1">Sesi masuk Anda hari ini telah dicatat. Selamat bekerja!</p>
            </div>

            {/* Clock In Info Card */}
            <div className="p-5 bg-gradient-to-br from-[var(--bg)] to-white rounded-2xl border border-[var(--line)] shadow-sm flex flex-col items-center">
              <span className="text-[11px] font-bold tracking-widest text-[var(--green)] uppercase">WAKTU MASUK</span>
              <span className="text-[36px] font-black text-[var(--ink)] mt-1 tracking-tight">
                {formatTimeStr(attendanceToday?.clock_in || new Date().toISOString())}
              </span>
              
              {attendanceToday?.clock_in_photo_url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden mt-4 border border-black/5 shadow-sm">
                  <img src={attendanceToday.clock_in_photo_url} alt="Selfie In" className="w-full h-full object-cover" />
                </div>
              )}
              
              <span className="text-[11px] text-[var(--green)] font-semibold mt-3 flex items-center gap-1">
                <CheckCircle size={12} className="text-[var(--green)]" /> Terverifikasi dalam radius kantor
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
            {/* Camera Viewfinder */}
            <div className="w-full aspect-[3/4] max-h-[420px] glass rounded-[var(--radius-hris-xl)] overflow-hidden relative mb-6 shadow-xl border border-[var(--glass-border)] animate-in fade-in duration-300">
              {!streamActive && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm text-[var(--ink-3)] flex-col p-6 text-center">
                   <Loader2 className="animate-spin text-[var(--red)] mb-3" size={36} />
                   <span className="text-[15px] font-bold text-[var(--ink)]">Mempersiapkan Presensi</span>
                   <span className="text-[12px] text-[var(--ink-3)] mt-1">Mengakses kamera & memvalidasi GPS...</span>
                 </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Location Overlay */}
              <div className="absolute bottom-4 left-4 right-4 glass-strong backdrop-blur-md p-3 rounded-[var(--radius-hris)] text-[13px] flex items-center gap-3 border border-[var(--glass-border)]">
                {locationError ? (
                  <AlertCircle className="text-[var(--red)] shrink-0" size={20} />
                ) : isLocationValid ? (
                  <CheckCircle className="text-[var(--green)] shrink-0" size={20} />
                ) : (
                  <Navigation2 className="text-[var(--yellow)] shrink-0" size={20} />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-[var(--ink)]">
                    {locationError ? 'Gagal mendapatkan lokasi' : 'Lokasi Terdeteksi'}
                  </p>
                  <p className={`truncate text-[12px] mt-0.5 ${isLocationValid ? 'text-[var(--green)]' : 'text-[var(--ink-3)]'}`}>
                    {distance === null 
                      ? 'Menghitung jarak...' 
                      : isLocationValid 
                        ? `Dalam radius kantor (${(distance * 1000).toFixed(0)}m)` 
                        : `Terlalu jauh (${(distance * 1000).toFixed(0)}m dari batas)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              disabled={!isLocationValid || isSubmitting}
              onClick={() => handleAttendance(hasClockedIn ? 'out' : 'in')}
              className={`
                w-full h-14 rounded-full font-bold text-[15px] transition-all duration-300 transform active:scale-95 shadow-md flex justify-center items-center gap-2 mb-6
                ${!isLocationValid 
                  ? 'bg-[var(--surface-item)] text-[var(--ink-4)] cursor-not-allowed border border-[var(--glass-border)]' 
                  : isSubmitting
                    ? 'btn-primary opacity-70 cursor-wait'
                    : 'btn-primary'
                }
              `}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin text-white" />
              ) : hasClockedIn ? (
                <>Clock Out Sekarang <Clock size={18} /></>
              ) : (
                <>Clock In Sekarang <MapPin size={18} /></>
              )}
            </button>
          </>
        )}

      </div>

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
    </div>
  );
}
