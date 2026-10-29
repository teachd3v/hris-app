"use client"

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  userName: string
  userEmail: string
}

export default function PendingApprovalClient({ userName, userEmail }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff7f0 0%, #fff 50%, #f0f4ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.08)',
          maxWidth: '460px',
          width: '100%',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        {/* Logo / Brand */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #FF6B35, #FFAA00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
            }}
          >
            ⏳
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#FF6B35',
              marginBottom: '4px',
            }}
          >
            TEACH HRIS
          </div>
        </div>

        {/* Pulsing Status Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,170,0,0.12)',
            border: '1px solid rgba(255,170,0,0.3)',
            borderRadius: '100px',
            padding: '6px 16px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FFAA00',
              display: 'inline-block',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFAA00', letterSpacing: '1px' }}>
            MENUNGGU PERSETUJUAN
          </span>
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 900,
            color: '#1a1a2e',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}
        >
          Halo, {userName}! 👋
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#666',
            lineHeight: 1.7,
            marginBottom: '8px',
          }}
        >
          Akun <strong style={{ color: '#1a1a2e' }}>{userEmail}</strong> kamu sudah terdaftar dan sedang menunggu persetujuan dari Admin.
        </p>

        <p
          style={{
            fontSize: '14px',
            color: '#888',
            lineHeight: 1.7,
            marginBottom: '36px',
          }}
        >
          Setelah Admin menyetujui akun kamu, kamu akan bisa mengakses semua fitur HRIS. Silakan klik <strong>Cek Status</strong> untuk memperbarui status secara manual.
        </p>

        {/* Info Steps */}
        <div
          style={{
            background: 'rgba(0,0,0,0.03)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          {[
            { step: '1', text: 'Akun kamu telah berhasil terdaftar', done: true },
            { step: '2', text: 'Menunggu persetujuan Admin', done: false, active: true },
            { step: '3', text: 'Lengkapi data profil kamu', done: false },
            { step: '4', text: 'Akses penuh ke semua fitur HRIS', done: false },
          ].map(({ step, text, done, active }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: step !== '4' ? '12px' : '0' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: done ? '#22c55e' : active ? '#FFAA00' : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: done || active ? 'white' : '#9ca3af',
                  flexShrink: 0,
                }}
              >
                {done ? '✓' : step}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: done ? '#22c55e' : active ? '#1a1a2e' : '#9ca3af',
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF6B35, #FFAA00)',
              color: 'white',
              fontWeight: 800,
              fontSize: '15px',
              border: 'none',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {isRefreshing ? '🔄 Memeriksa status...' : '🔄 Cek Status Persetujuan'}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'transparent',
              color: '#888',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Keluar dari Akun
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
