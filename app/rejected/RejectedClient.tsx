"use client"

import { signOut } from 'next-auth/react'

interface Props {
  userName: string
  userEmail: string
}

export default function RejectedClient({ userName, userEmail }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff0f0 0%, #fff 50%, #fff0f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,100,100,0.2)',
          boxShadow: '0 24px 80px rgba(220,38,38,0.1)',
          maxWidth: '460px',
          width: '100%',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        {/* Warning Icon */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626, #ff4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(220,38,38,0.35)',
            }}
          >
            🚫
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#dc2626',
            }}
          >
            TEACH HRIS
          </div>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
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
              background: '#dc2626',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', letterSpacing: '1px' }}>
            AKSES DITOLAK
          </span>
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 900,
            color: '#1a1a2e',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Pendaftaran Ditolak
        </h1>

        {/* Critical Warning Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(255,68,68,0.06))',
            border: '2px solid rgba(220,38,38,0.25)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              marginBottom: '8px',
            }}
          >
            ⚠️
          </div>
          <p
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#dc2626',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Akun <strong>{userEmail}</strong> telah ditolak oleh Admin dan akan <u>dihapus dalam 24 jam</u> karena tidak mendapatkan persetujuan.
          </p>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.7,
            marginBottom: '32px',
          }}
        >
          Halo <strong style={{ color: '#1a1a2e' }}>{userName}</strong>, jika kamu merasa ini adalah kesalahan, silakan hubungi Admin HRIS secara langsung untuk klarifikasi lebih lanjut.
        </p>

        {/* Contact Info */}
        <div
          style={{
            background: 'rgba(0,0,0,0.03)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '28px',
            fontSize: '13px',
            color: '#666',
          }}
        >
          <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>📞 Hubungi Admin HRIS</div>
          <div>Kontak: admin@te4ch.id atau hubungi HR Dept secara langsung</div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #dc2626, #ff4444)',
            color: 'white',
            fontWeight: 800,
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
          }}
        >
          Keluar dari Aplikasi
        </button>
      </div>
    </div>
  )
}
