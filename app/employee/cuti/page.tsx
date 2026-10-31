'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  X, 
  FileText, 
  User, 
  ChevronRight, 
  Info,
  Loader2,
  CalendarRange,
  CornerDownRight,
  PlaneTakeoff,
  Users,
  Home
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/common/DashboardLayout';
import { 
  getLeaveRequests, 
  getEmployeeLeaveInfo, 
  getTeamApprovedLeaves, 
  getManagerApprovals,
  approveByManager,
  createLeaveRequest, 
  cancelLeaveRequest, 
  type LeaveRequest
} from './actions';
import { LEAVE_TYPES, calculateLeaveDuration, validateLeaveDates, type LeaveCategory } from '@/lib/leave';
import ApprovalList from '@/components/cuti/ApprovalList';

import { EMPLOYEE_MENU } from "@/lib/navigation";


export default function LeavePage() {
  const router = useRouter();
  
  // Data States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [managerApprovals, setManagerApprovals] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveCategory>('Cuti Tahunan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState(0);
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  // Fetch Data Function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const info = await getEmployeeLeaveInfo();
      if ('error' in info) {
        setLoadError(info.error);
        return;
      }
      setEmployeeInfo(info);

      const requests = await getLeaveRequests();
      setLeaveRequests(requests);

      const team = await getTeamApprovedLeaves();
      setTeamLeaves(team);

      setManagerApprovals(await getManagerApprovals());
    } catch (err: any) {
      console.error(err);
      setLoadError('Gagal memuat sebagian data. Muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateDuration = calculateLeaveDuration;

  // Update duration whenever date ranges change
  useEffect(() => {
    const days = calculateDuration(selectedType, startDate, endDate);
    setDurationDays(days);
  }, [selectedType, startDate, endDate]);

  // Handle new submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validasi Front-end
    if (!startDate || !endDate || !reason) {
      setFormError('Mohon lengkapi semua kolom wajib.');
      return;
    }

    const dateError = validateLeaveDates(selectedType, startDate, endDate);
    if (dateError) {
      setFormError(dateError);
      return;
    }

    // Validasi Gender
    if (selectedType === 'Cuti Ayah' && employeeInfo?.gender === 'Perempuan') {
      setFormError('Cuti Ayah hanya diperuntukkan bagi karyawan Laki-laki.');
      return;
    }
    if (selectedType === 'Cuti Melahirkan' && employeeInfo?.gender === 'Laki-laki') {
      setFormError('Cuti Melahirkan hanya diperuntukkan bagi karyawan Perempuan.');
      return;
    }

    // Validasi Kuota (server tetap memvalidasi ulang)
    const bal = employeeInfo?.balances?.find((b: any) => b.type === selectedType);
    if (bal && bal.remaining !== null && durationDays > bal.remaining) {
      setFormError(`Kuota ${selectedType} Anda tidak mencukupi (Tersisa ${Math.max(bal.remaining, 0)} Hari).`);
      return;
    }

    // Validasi Lampiran untuk Sakit
    const typeObj = LEAVE_TYPES.find(t => t.key === selectedType);
    if (typeObj?.requiresAttachment && !attachment) {
      setFormError('Dokumen lampiran Surat Dokter wajib diunggah.');
      return;
    }

    // Validasi detail waktu untuk izin jam-jaman
    if ((selectedType === 'Izin Terlambat' || selectedType === 'Izin Pulang Cepat') && (!startTime || !endTime)) {
      setFormError('Detail jam wajib diisi untuk izin ini.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leave_type', selectedType);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('duration_days', durationDays.toString());
      formData.append('reason', reason);
      if (startTime) formData.append('start_time', startTime);
      if (endTime) formData.append('end_time', endTime);
      if (attachment) formData.append('attachment', attachment);

      const res = await createLeaveRequest(formData);
      if (res?.error) {
        setFormError(res.error);
        return;
      }
      
      // Reset Form & Close
      setSelectedType('Cuti Tahunan');
      setStartDate('');
      setEndDate('');
      setReason('');
      setStartTime('');
      setEndTime('');
      setAttachment(null);
      setIsModalOpen(false);
      
      // Refresh Data
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Request
  const handleCancel = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan cuti ini?')) return;
    setCancellingId(id);
    try {
      const res = await cancelLeaveRequest(id);
      if (res?.error) alert(res.error);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pengajuan.');
    } finally {
      setCancellingId(null);
    }
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_DIRECT_MANAGER':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">Atasan</span>;
      case 'PENDING_HC_ADMIN':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">HC Admin</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">Disetujui</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">{status}</span>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    return <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-white bg-ink px-2.5 py-0.5 rounded-md">{type}</span>;
  };

  return (
    <DashboardLayout
      role="Karyawan"
      userName={employeeInfo?.name || 'Memuat...'}
      userInitials={employeeInfo?.name ? employeeInfo.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
      userPhoto={undefined}
      menuSections={EMPLOYEE_MENU}
      hideTopbar={true}
      hideBottomNav={true}
      noPadding={true}
    >
    <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
      
      {/* Mobile Hero Header */}
      <div className="relative pt-5 pb-14 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-[40px] -mr-20 -mt-20"></div>
        
        <Link href="/employee/dashboard" className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors">
          <Home size={18} strokeWidth={2.5} className="text-white" />
        </Link>

        <div className="relative z-10 text-center flex flex-col items-center mt-2">
          <h1 className="text-white/90 text-[14px] font-bold tracking-widest uppercase mb-2">Cuti & Izin</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex page-head flex-col md:flex-row md:items-end justify-between gap-6 px-5 pt-5">
        <div>
          <span className="eyebrow">Manajemen Waktu</span>
          <h1 className="text-ink">Cuti & Izin</h1>
          <p className="text-ink-3">Ajukan cuti, izin harian, atau dinas luar kota serta pantau persetujuan atasan.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--red)] text-white rounded-full font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/20 active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={3} />
          Buat Pengajuan
        </button>
      </div>

      {/* Mobile Overlapping Card & Content Wrapper */}
      <div className="relative z-20 px-4 md:px-5 -mt-8 md:mt-0 flex flex-col gap-3 md:gap-5">
        
        {/* Mobile Overlapping Card */}
        <div className="md:hidden bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-3 border border-[var(--line)] flex flex-col items-center text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--red)] text-white rounded-full font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Buat Pengajuan
          </button>
        </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center glass rounded-[32px] border-line-2">
          <Loader2 size={40} className="text-ink-3 animate-spin mb-4" />
          <p className="text-ink-3 font-medium">Memuat dashboard cuti...</p>
        </div>
      ) : (
        <>
          {loadError && (
            <div role="alert" className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[12px] text-red-800 flex items-start justify-between gap-3">
              <span><strong>Data cuti gagal dimuat.</strong> {loadError}</span>
              <button type="button" onClick={() => window.location.reload()} className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-red-200 font-bold">Muat ulang</button>
            </div>
          )}

          {/* Ringkasan jatah: 2 kolom ringkas */}
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            <div className="bg-white rounded-[20px] md:rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-3 md:p-5 border border-[var(--line)] flex items-center gap-3 md:gap-4">
              <div className="w-9 h-9 md:w-12 md:h-12 bg-green-50 rounded-xl md:rounded-2xl flex items-center justify-center text-green-600 shadow-inner shrink-0">
                <CheckCircle2 className="w-[18px] h-[18px] md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--ink-3)] font-bold uppercase tracking-wider">Cuti</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-ink">{employeeInfo?.leave_available}</span>
                  <span className="text-[12px] md:text-[14px] font-bold text-ink-3">/ {employeeInfo?.leave_total}</span>
                  <span className="text-[11px] font-bold text-ink-3">Hari</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] md:rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-3 md:p-5 border border-[var(--line)] flex items-center gap-3 md:gap-4">
              <div className="w-9 h-9 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
                <CalendarRange className="w-[18px] h-[18px] md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--ink-3)] font-bold uppercase tracking-wider">Ganti Hari</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-ink">{employeeInfo?.leave_ganti_hari}</span>
                  <span className="text-[11px] font-bold text-ink-3">Hari</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persetujuan bawahan (khusus atasan) */}
          {managerApprovals.length > 0 && (
            <div className="bg-white rounded-[24px] border border-orange-200 p-5">
              <h3 className="text-[14px] font-black text-ink mb-3">Persetujuan Bawahan ({managerApprovals.length})</h3>
              <ApprovalList
                requests={managerApprovals}
                onDecide={async (id, approve, notes) => {
                  const res = await approveByManager(id, approve, notes);
                  if (!res.error) await fetchData();
                  return res;
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Content: Leave Request History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[var(--line)] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[16px] font-black text-ink">Riwayat Pengajuan</h3>
                  <span className="text-[10px] font-bold px-2 py-1 bg-surface-item text-ink-3 rounded-lg border border-line-2">Total: {leaveRequests.length}</span>
                </div>

                {leaveRequests.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-surface-item border border-line-2 flex items-center justify-center text-2xl mb-4 opacity-70">
                      📅
                    </div>
                    <h4 className="text-md font-bold text-ink">Belum Ada Pengajuan</h4>
                    <p className="text-[12px] text-ink-3 mt-1 max-w-xs">Anda belum pernah mengajukan cuti atau izin di sistem ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.map((req) => (
                      <div key={req.id} className="border border-line rounded-2xl p-4 hover:border-ink/20 transition-all flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center group">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {getLeaveTypeBadge(req.leave_type)}
                            {getStatusBadge(req.status)}
                          </div>
                          <h4 className="text-[14px] font-extrabold text-ink leading-tight">
                            {new Date(req.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(req.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="text-ink-3 font-medium text-[12px] ml-2">({req.duration_days} Hari)</span>
                          </h4>
                          <p className="text-[12px] text-ink-3 font-medium line-clamp-1 leading-relaxed">
                            Alasan: "{req.reason}"
                          </p>
                          {(req.start_time || req.end_time) && (
                            <p className="text-[11px] text-[var(--red)] font-bold flex items-center gap-1">
                              <Clock size={12} /> Detail waktu: {req.start_time || '--:--'} - {req.end_time || '--:--'}
                            </p>
                          )}
                          {req.attachment_url && (
                            <a href={req.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline">
                              <FileText size={12} /> Lihat Lampiran Dokumen
                            </a>
                          )}

                          {/* Approval Notes Display */}
                          {req.status === 'REJECTED' && (req.manager_notes || req.hc_notes) && (
                            <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-[11px] text-red-800 space-y-1 mt-2">
                              {req.manager_notes && <p><strong>Catatan Manager:</strong> "{req.manager_notes}"</p>}
                              {req.hc_notes && <p><strong>Catatan HC:</strong> "{req.hc_notes}"</p>}
                            </div>
                          )}
                        </div>

                        {(req.status === 'PENDING_DIRECT_MANAGER' || req.status === 'PENDING_HC_ADMIN') && (
                          <button
                            disabled={cancellingId === req.id}
                            onClick={() => handleCancel(req.id)}
                            className="px-4 py-2 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 hover:border-red-200 shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                          >
                            {cancellingId === req.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>Batalkan</>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Content: Team Approved Calendar list */}
            <div className="space-y-6">
              {/* Approver Direct Manager Info */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-[24px] border border-blue-100/50 p-5 shadow-sm">
                <h4 className="text-[13px] font-black text-indigo-950 flex items-center gap-2">
                  <User size={16} /> Atasan Persetujuan Anda
                </h4>
                <div className="mt-3 flex items-center gap-3 bg-white p-3 rounded-xl border border-line-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[12px] text-indigo-700 shadow-inner">
                    {employeeInfo?.manager_name ? employeeInfo.manager_name.charAt(0) : '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[12px] text-ink truncate">{employeeInfo?.manager_name || 'Tidak ada (Pucuk Pimpinan)'}</p>
                    <p className="text-[10px] text-ink-3 truncate mt-0.5">Level 1 Approver</p>
                  </div>
                </div>
              </div>

              {/* Team Approved Leave Schedule */}
              <div className="bg-white rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[var(--line)] p-5">
                <div className="flex items-center gap-2 mb-4 text-ink">
                  <Users size={18} />
                  <h3 className="text-[14px] font-black">Cuti Rekan Setim (Departemen)</h3>
                </div>

                {teamLeaves.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center">
                    <span className="text-3xl grayscale opacity-30">📅</span>
                    <p className="text-[11px] font-bold text-ink-3 mt-2">Tidak ada jadwal cuti rekan setim saat ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamLeaves.map((tl) => (
                      <div key={tl.id} className="p-3 bg-[var(--bg)] rounded-xl border border-line flex flex-col gap-1 hover:border-ink/10 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-extrabold text-ink">{tl.employee_name}</span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-white text-ink-2 border border-line-2 uppercase">{tl.leave_type}</span>
                        </div>
                        <div className="text-[9px] text-ink-3 font-semibold mt-1">
                          {new Date(tl.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(tl.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ({tl.duration_days} Hari)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Application Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-ink text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-black tracking-tight">Buat Pengajuan Baru</h3>
                <p className="text-[11px] text-white/80 mt-0.5 font-medium">Lengkapi rincian jenis cuti, tanggal, dan alasan pengajuan Anda.</p>
              </div>
              <button 
                onClick={() => {
                  setFormError('');
                  setIsModalOpen(false);
                }} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white relative z-10"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-[var(--bg)]">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5 items-start text-[12px] text-red-800 animate-in shake duration-300">
                  <AlertCircle className="shrink-0 text-[var(--red)]" size={16} />
                  <span className="font-semibold leading-relaxed">{formError}</span>
                </div>
              )}

              {/* Tipe Cuti */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">Tipe Pengajuan</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const next = e.target.value as LeaveCategory;
                    setSelectedType(next);
                    // Izin per jam hanya satu tanggal: tanggal selesai mengikuti tanggal mulai
                    if (LEAVE_TYPES.find(t => t.key === next)?.timeBased) setEndDate(startDate);
                    setFormError('');
                  }}
                  className="w-full h-12 px-4 rounded-2xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                      {(() => {
                        const b = employeeInfo?.balances?.find((x: any) => x.type === type.key);
                        return b && b.remaining !== null ? ` — sisa ${Math.max(b.remaining, 0)} hari` : '';
                      })()}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-ink-3 mt-1 font-medium italic">
                  {LEAVE_TYPES.find(t => t.key === selectedType)?.desc}
                </p>
              </div>

              {/* Grid Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (LEAVE_TYPES.find(t => t.key === selectedType)?.timeBased) setEndDate(e.target.value);
                      setFormError('');
                    }}
                    className="w-full h-12 px-4 rounded-2xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    disabled={Boolean(LEAVE_TYPES.find(t => t.key === selectedType)?.timeBased)}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setFormError('');
                    }}
                    className="w-full h-12 px-4 disabled:opacity-60 disabled:bg-gray-50 rounded-2xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Durasi Info */}
              <div className="bg-white p-3 rounded-xl border border-line shadow-sm flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Total Hari Terhitung:</span>
                <span className="text-[16px] font-black text-ink">{durationDays} Hari Kerja</span>
              </div>

              {/* Izin Terlambat / Pulang Cepat Details */}
              {(selectedType === 'Izin Terlambat' || selectedType === 'Izin Pulang Cepat') && (
                <div className="p-4 bg-red-50/30 rounded-2xl border border-[var(--red)]/10 space-y-4 animate-in slide-in-from-top-3 duration-300">
                  <h4 className="text-[11px] font-black text-[var(--red)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} /> Tentukan Detail Jam
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-ink-3 uppercase">Mulai Jam</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink focus:border-red-400 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-ink-3 uppercase">Selesai Jam</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink focus:border-red-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Attachment Lampiran */}
              {LEAVE_TYPES.find(t => t.key === selectedType)?.requiresAttachment && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">Lampiran Dokumen (Surat Dokter)*</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setAttachment(files[0]);
                        setFormError('');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-line-2 text-[11px] font-bold text-ink-3 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-ink file:text-white hover:file:bg-black file:cursor-pointer shadow-sm"
                  />
                  <p className="text-[10px] text-ink-4 mt-1 font-medium">Format berkas: JPG, PNG, WEBP, atau PDF (Maks. 5MB)</p>
                </div>
              )}

              {/* Alasan Pengajuan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">Alasan Pengajuan</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setFormError('');
                  }}
                  placeholder="Contoh: Sakit demam perlu istirahat total, Menghadiri prosesi akad nikah..."
                  className="w-full p-4 rounded-2xl bg-white border border-line-2 text-[13px] font-semibold text-ink focus:outline-none focus:border-ink placeholder:text-ink-4 transition-colors shadow-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-line flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-13 rounded-full font-bold text-[14px] text-ink border border-line hover:bg-white/50 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-13 rounded-full font-bold text-[14px] text-white bg-[var(--red)] hover:bg-red-700 active:scale-95 transition-all shadow-lg hover:shadow-red-500/10 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      Memproses...
                    </>
                  ) : (
                    <>Kirim Pengajuan</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
    </DashboardLayout>
  );
}
