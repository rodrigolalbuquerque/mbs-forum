// Regenera os ícones do PWA, o favicon e a logo de exibição a partir do
// master em scripts/logo-source.png (alta resolução, não servido ao cliente).
// Downscale por média de área (box filter) — boa qualidade, JS puro.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = PNG.sync.read(readFileSync(join(root, "scripts", "logo-source.png")));

// inset: fração da borda a descartar (ex.: 0.06 corta 6% de cada lado),
// útil para o ícone do iOS ficar "cheio" (sem a margem branca).
function resize(source, size, inset = 0) {
  const out = new PNG({ width: size, height: size });
  const { width: sw, height: sh, data: sd } = source;
  const ox = Math.round(sw * inset);
  const oy = Math.round(sh * inset);
  const rw = sw - 2 * ox;
  const rh = sh - 2 * oy;
  for (let y = 0; y < size; y++) {
    const y0 = oy + Math.floor((y * rh) / size);
    const y1 = Math.max(y0 + 1, oy + Math.floor(((y + 1) * rh) / size));
    for (let x = 0; x < size; x++) {
      const x0 = ox + Math.floor((x * rw) / size);
      const x1 = Math.max(x0 + 1, ox + Math.floor(((x + 1) * rw) / size));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * sw + xx) << 2;
          r += sd[i]; g += sd[i + 1]; b += sd[i + 2]; a += sd[i + 3];
          n++;
        }
      }
      const o = (y * size + x) << 2;
      out.data[o] = Math.round(r / n);
      out.data[o + 1] = Math.round(g / n);
      out.data[o + 2] = Math.round(b / n);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  writeFileSync(
    join(iconsDir, `icon-${size}.png`),
    PNG.sync.write(resize(src, size)),
  );
  console.log(`icon-${size}.png gerado`);
}

// Logo de exibição (telas de login/instalar/inicial) — 256px é suficiente
// e bem mais leve que a resolução cheia.
writeFileSync(join(root, "public", "logo.png"), PNG.sync.write(resize(src, 256)));
console.log("public/logo.png gerado (256px, exibição)");

// Favicon / ícone do app (Next usa src/app/icon.png automaticamente). 256px basta.
writeFileSync(join(root, "src", "app", "icon.png"), PNG.sync.write(resize(src, 256)));
console.log("src/app/icon.png gerado (256px)");

// Ícone do iOS (apple-touch-icon). 180px, com leve corte da borda branca
// porque o iOS aplica o próprio arredondamento por cima.
writeFileSync(
  join(root, "src", "app", "apple-icon.png"),
  PNG.sync.write(resize(src, 180, 0.06)),
);
console.log("src/app/apple-icon.png gerado (iOS)");

