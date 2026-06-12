// Paylaşılan SAF mantığı (repo kökündeki src/engine + src/data) mobile/shared'a
// kopyalar. NEDEN: Metro, proje kökü DIŞINDAKİ dosyaları bu ortamda güvenilir
// indeksleyemiyor (watchFolders + bozuk watchman). Bu yüzden engine/data'yı proje
// kökü İÇİNE aynalıyoruz.
//
// ÖNEMLİ: mobile/shared ÜRETİLMİŞ bir aynadır — ASLA elle düzenleme. Tek doğruluk
// kaynağı hâlâ repo kökündeki src/. Kod değişince bu script yeniden çalışır
// (npm start → prestart hook'u otomatik çağırır; elle: npm run sync).

import { cpSync, rmSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoSrc = resolve(here, "../../src");
const dest = resolve(here, "../shared");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(resolve(repoSrc, "engine"), resolve(dest, "engine"), { recursive: true });
cpSync(resolve(repoSrc, "data"), resolve(dest, "data"), { recursive: true });

console.log("✓ Senkron: src/{engine,data} → mobile/shared/{engine,data}");
