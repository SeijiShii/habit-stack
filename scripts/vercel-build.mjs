// Build Output API ビルダー（O51 対策 / CF-20260529-013）
// api/*.ts は ../../src/*.js への相対 import を持つため、@vercel/node の zero-config では
// ERR_MODULE_NOT_FOUND になる。esbuild で各関数を自己完結 bundle し、.vercel/output を生成する。
// deploy は必ず `vercel deploy --prebuilt --prod`（= scripts/deploy-prod.sh）で行う。
//
// 本 PJ の api ハンドラは Web 標準シグネチャ（(req: Request) => Promise<Response>）。
// Vercel の nodejs ランチャは Node 形式 (req,res) を渡すため、各関数を **Node↔Web アダプタ**で
// ラップして bundle する（カスタム esbuild では @vercel/node の Web ハンドラ変換が効かないため）。
// アダプタは生 body を Buffer で読んで Web Request に渡すので、webhook の req.text() は生バイトを返す。
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import {
  readdirSync, statSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, '.vercel', 'output');
const API_DIR = join(ROOT, 'api');
const DIST = join(ROOT, 'dist');

// 1) static build（vite）
console.log('[vercel-build] 1/4 vite build…');
execSync('npx vite build', { stdio: 'inherit', cwd: ROOT });

// 2) api エントリ収集（*.test.ts 除外）
function collect(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collect(p));
    else if (/\.ts$/.test(name) && !/\.test\.ts$/.test(name)) out.push(p);
  }
  return out;
}
const entries = existsSync(API_DIR) ? collect(API_DIR) : [];

// Node (req,res) → Web Request → Web Response → Node res のアダプタ。
// __ENTRY__ は esbuild stdin の import パスに置換する。
function adapterSource(entryAbsPath) {
  return `
import webHandler from ${JSON.stringify(entryAbsPath)};

export default async function (req, res) {
  try {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['host'] || 'localhost';
    const url = new URL(req.url || '/', proto + '://' + host);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) { for (const x of v) headers.append(k, x); }
      else if (v != null) headers.set(k, String(v));
    }

    let body;
    const method = req.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      const chunks = [];
      for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
      if (chunks.length) body = Buffer.concat(chunks);
    }

    const request = new Request(url.toString(), { method, headers, body });
    const response = await webHandler(request);

    res.statusCode = response.status;
    response.headers.forEach((val, key) => res.setHeader(key, val));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error('[fn-adapter] error', err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ error: 'internal_error' }));
  }
}
`;
}

// 3) 各関数を adapter でラップして bundle → .vercel/output/functions/<route>.func/index.mjs
console.log(`[vercel-build] 2/4 bundling ${entries.length} functions (Node↔Web adapter)…`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'functions'), { recursive: true });

for (const entry of entries) {
  const rel = relative(API_DIR, entry).replace(/\.ts$/, ''); // 例: sync/pull
  const route = `api/${rel}`;                                // 例: api/sync/pull
  const funcDir = join(OUT, 'functions', `${route}.func`);
  mkdirSync(funcDir, { recursive: true });
  await build({
    stdin: {
      contents: adapterSource(entry),
      resolveDir: ROOT,
      sourcefile: 'fn-adapter.mjs',
      loader: 'js',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: join(funcDir, 'index.mjs'),
    banner: { js: "import{createRequire as __cr}from'module';const require=__cr(import.meta.url);" },
    logLevel: 'warning',
  });
  writeFileSync(
    join(funcDir, '.vc-config.json'),
    JSON.stringify({ runtime: 'nodejs20.x', handler: 'index.mjs', launcherType: 'Nodejs' }, null, 2),
  );
}

// 4) static 配置 + routes
console.log('[vercel-build] 3/4 static…');
mkdirSync(join(OUT, 'static'), { recursive: true });
cpSync(DIST, join(OUT, 'static'), { recursive: true });

console.log('[vercel-build] 4/4 config.json…');
writeFileSync(
  join(OUT, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },        // static + functions
        { src: '/(.*)', dest: '/index.html' }, // SPA fallback
      ],
    },
    null,
    2,
  ),
);

console.log(`[vercel-build] done: ${entries.length} functions, static=${DIST}`);
