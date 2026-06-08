// favicon.svg を単一ソースとして PWA アイコンを派生生成（O56）。
// 使い方: npm run gen:favicon
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const svg = await readFile(join(pub, 'favicon.svg'));

const targets = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const t of targets) {
  await sharp(svg, { density: 384 }).resize(t.size, t.size).png().toFile(join(pub, t.name));
  console.log('✓', t.name);
}

// maskable: 余白(safe-area)を確保した背景付き
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#FAF8F3' },
})
  .composite([{ input: await sharp(svg, { density: 384 }).resize(360, 360).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(join(pub, 'icon-maskable-512.png'));
console.log('✓ icon-maskable-512.png');
