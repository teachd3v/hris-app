// Fetches Indonesian province + regency data from wilayah.id and writes
// it to lib/wilayah-data.ts as a static TypeScript module.
// Re-run when administrative regions change (e.g. new province pemekaran).
//
// Usage: node scripts/build-wilayah-data.mjs

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "https://wilayah.id/api";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const { data: provinces } = await fetchJson(`${BASE}/provinces.json`);

const regencyPairs = await Promise.all(
  provinces.map(async (p) => {
    const { data } = await fetchJson(`${BASE}/regencies/${p.code}.json`);
    return [p.code, data];
  }),
);
const regencies = Object.fromEntries(regencyPairs);

const out = `// Auto-generated from https://wilayah.id at ${new Date().toISOString()}
// Re-run: node scripts/build-wilayah-data.mjs

export interface Wilayah {
  code: string;
  name: string;
}

export const PROVINCES: Wilayah[] = ${JSON.stringify(provinces, null, 2)};

export const REGENCIES: Record<string, Wilayah[]> = ${JSON.stringify(regencies, null, 2)};
`;

const outPath = resolve("lib/wilayah-data.ts");
writeFileSync(outPath, out, "utf8");

const totalRegencies = Object.values(regencies).reduce((s, r) => s + r.length, 0);
console.log(
  `Wrote ${outPath} — ${provinces.length} provinces, ${totalRegencies} regencies.`,
);
