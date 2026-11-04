// Membuat sepasang kunci VAPID untuk Web Push. Jalankan di komputer Anda sendiri:
//   node scripts/generate-vapid-keys.mjs
// Lalu simpan sebagai secret Worker (jangan tempel kunci privat ke chat, commit, atau berkas di repo):
//   npx wrangler secret put VAPID_PUBLIC_KEY
//   npx wrangler secret put VAPID_PRIVATE_KEY
// Opsional: npx wrangler secret put VAPID_SUBJECT   (mis. mailto:alamat-admin@domain.org; bawaan https://hrteach.site)
import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
const b64u = (buf) => buf.toString("base64url");

console.log("VAPID_PUBLIC_KEY=" + b64u(ecdh.getPublicKey()));
console.log("VAPID_PRIVATE_KEY=" + b64u(ecdh.getPrivateKey()));
console.log("\nPENTING: kunci privat bersifat rahasia. Simpan hanya lewat 'wrangler secret put'.");
console.log("Kunci publik dan privat harus dipakai sebagai satu pasang; mengganti pasangan membuat semua langganan lama tidak berlaku.");
