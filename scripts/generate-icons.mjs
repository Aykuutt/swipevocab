// Uygulama ikonlarını üretir (maskot Kart, koyu zemin). İkon değişince bir kez çalıştır:
//   node scripts/generate-icons.mjs
// Çıktılar public/ altına yazılır ve depoya eklenir; derleme bu betiğe ihtiyaç duymaz.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#150F1F";

// Maskot (mutlu yüz) — src/components/Mascot.jsx ile aynı çizim, renkler satır içi.
const mascot = `
  <path d="M20 78 L8 96 M100 78 L112 96" fill="none" stroke="#eadfc6" stroke-width="6" stroke-linecap="round"/>
  <rect x="40" y="116" width="15" height="15" rx="7" fill="#eadfc6" stroke="#cfc09f" stroke-width="1.5"/>
  <rect x="65" y="116" width="15" height="15" rx="7" fill="#eadfc6" stroke="#cfc09f" stroke-width="1.5"/>
  <rect x="20" y="18" width="80" height="102" rx="12" fill="#F6EEDC" stroke="#d8cbae" stroke-width="1.5"/>
  <path d="M20 44 H100" stroke="rgba(255,107,93,0.6)" stroke-width="1.6"/>
  <path d="M20 100 H100 M20 110 H100" stroke="rgba(70,110,190,0.28)" stroke-width="1.2" fill="none"/>
  <g fill="${BG}"><circle cx="42" cy="29" r="3.4"/><circle cx="60" cy="29" r="3.4"/><circle cx="78" cy="29" r="3.4"/></g>
  <circle cx="36" cy="75" r="6.5" fill="rgba(255,107,93,0.35)"/>
  <circle cx="84" cy="75" r="6.5" fill="rgba(255,107,93,0.35)"/>
  <ellipse cx="46" cy="62" rx="5.2" ry="7.2" fill="#231a2e"/>
  <ellipse cx="74" cy="62" rx="5.2" ry="7.2" fill="#231a2e"/>
  <circle cx="47.6" cy="59.4" r="1.9" fill="#fff"/>
  <circle cx="75.6" cy="59.4" r="1.9" fill="#fff"/>
  <path d="M49 77 Q60 89 71 77" fill="none" stroke="#231a2e" stroke-width="3.6" stroke-linecap="round"/>`;

// Maskotun kutusu (kollar ve ayaklar dahil): x 6..114, y 18..131 -> merkez (60, 74.5)
function iconSvg({ size = 512, scale, rounded }) {
  const tx = size / 2 - 60 * scale;
  const ty = size / 2 - 74.5 * scale;
  const bg = rounded
    ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BG}"/>`
    : `<rect width="${size}" height="${size}" fill="${BG}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bg}<g transform="translate(${tx} ${ty}) scale(${scale})">${mascot}</g></svg>`;
}

mkdirSync("public/icons", { recursive: true });

// Normal ikon: köşeleri yuvarlak, maskot büyük.
const icon = iconSvg({ scale: 3.4, rounded: true });
writeFileSync("public/favicon.svg", icon);
await sharp(Buffer.from(icon)).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(icon)).resize(512).png().toFile("public/icons/icon-512.png");

// Maskable: tam kare zemin, maskot güvenli alanın (merkezdeki %60) içinde.
const maskable = iconSvg({ scale: 2.5, rounded: false });
await sharp(Buffer.from(maskable)).resize(512).png().toFile("public/icons/maskable-512.png");

// iOS ana ekran ikonu: köşeleri iOS kendisi yuvarlar, şeffaflık olmamalı.
const apple = iconSvg({ scale: 3.0, rounded: false });
await sharp(Buffer.from(apple)).resize(180).png().toFile("public/icons/apple-touch-icon.png");

console.log("İkonlar üretildi: public/favicon.svg, public/icons/*.png");
