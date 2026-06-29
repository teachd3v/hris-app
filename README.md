# TEACH Portal — HRIS App

> **v1.0.0** — First stable release · [hris-teach.vercel.app](https://hris-teach.vercel.app)

Sistem Informasi SDM internal untuk **TEACH GREAT Edunesia**. Dibangun di atas Next.js 16, Supabase, dan di-deploy ke Vercel.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Database & Auth | Supabase (PostgreSQL + Google OAuth) |
| Styling | Tailwind CSS v4 |
| Deploy | Vercel (Singapore region) |
| CI/CD | GitHub Actions |

## Setup untuk Dev Baru

### Prerequisites
- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- Docker Desktop (untuk local Supabase)

### 1. Clone & install

```bash
git clone https://github.com/teachd3v/hris-app.git
cd hris-app
npm install
```

### 2. Setup environment

```bash
cp .env.example .env.local
```

Isi nilai di `.env.local` — ambil dari Supabase Dashboard → Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Jalankan local Supabase

```bash
npm run db:start
```

Ini akan start Docker container Supabase lokal beserta migration & seed otomatis.

### 4. Jalankan dev server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Deskripsi |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build production |
| `npm run check` | Typecheck + lint (jalankan sebelum push) |
| `npm run typecheck` | TypeScript check saja |
| `npm run lint` | ESLint saja |
| `npm run db:start` | Start local Supabase (Docker) |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset DB lokal + jalankan seed |
| `npm run db:diff` | Diff schema lokal vs production |
| `npm run db:push` | Push migrations ke production |
| `npm run db:types` | Generate `types/database.ts` dari production schema |
| `npm run db:types:local` | Generate types dari local Supabase |

---

## Workflow Development

### Membuat migration baru

```bash
# 1. Buat file migration
supabase migration new nama_migration

# 2. Tulis SQL di file yang terbuat di supabase/migrations/

# 3. Test di lokal
npm run db:reset

# 4. Update TypeScript types
npm run db:types:local

# 5. Commit & push ke main → GitHub Actions otomatis push ke production
git add supabase/migrations/ types/database.ts
git commit -m "feat: ..."
git push
```

### Pre-commit hook

Setiap commit otomatis menjalankan `typecheck + lint`. Kalau gagal, commit dibatalkan — fix dulu sebelum commit.

---

## Deployment

- **Production**: push ke `main` → Vercel auto-deploy + GitHub Actions push migrations
- **Preview**: buat PR → Vercel auto-deploy preview URL
- **Production URL**: [https://hris-teach.vercel.app](https://hris-teach.vercel.app)

## Akses Admin

Login Google hanya bisa dengan akun yang terdaftar. Role admin ditentukan oleh kolom `role = 'Admin'` di tabel `employees`.
