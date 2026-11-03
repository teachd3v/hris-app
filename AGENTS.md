<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Alur kerja perubahan kode

- Setelah selesai mengubah kode dan `npm run typecheck` serta `npm run lint` lolos, langsung commit, push ke branch kerja, dan buat pull request tanpa menunggu diminta.
- Merge dilakukan manual oleh pemilik repo. Merge ke `main` otomatis men-deploy ke produksi lewat Cloudflare Workers Builds.
- Migrasi D1 dijalankan manual (lihat README, bagian Migrasi database). Bila perubahan butuh migrasi, tulis di deskripsi PR dan jalankan migrasinya **sebelum** merge.
- Deskripsi PR harus jujur soal pengujian: sebutkan apa yang sudah dijalankan dan tandai perubahan tampilan yang belum dicek di perangkat sebagai "perlu dicek manual".
- Perubahan yang berisiko atau ambigu ditanyakan dulu sebelum dikerjakan.
