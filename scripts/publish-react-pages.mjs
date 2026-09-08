import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

const root = process.cwd();
const dist = join(root, 'dist');
const pages = ['events.html', 'create.html', 'edit.html', 'post.html'];

function findHtml(name) {
  return [join(dist, name), join(dist, 'src/html', name)].find(existsSync);
}

for (const name of pages) {
  const src = findHtml(name);
  if (!src) throw new Error(`缺少构建产物 ${name}`);
  let html = readFileSync(src, 'utf8');
  html = html
    .replaceAll('../../assets/', './assets/')
    .replaceAll('../../site-loader.js', './site-loader.js')
    .replaceAll('../../zzz-tv-transition.js', './zzz-tv-transition.js')
    .replaceAll('../../zzz-tv-transition.css', './zzz-tv-transition.css');
  writeFileSync(join(root, name), html);
}

const distAssets = join(dist, 'assets');
const outAssets = join(root, 'assets');
if (!existsSync(distAssets)) throw new Error('缺少 dist/assets');
mkdirSync(outAssets, { recursive: true });
for (const file of readdirSync(distAssets)) {
  const ext = extname(file).toLowerCase();
  if (!['.js', '.css', '.svg', '.gif', '.woff', '.woff2', '.ttf'].includes(ext)) continue;
  cpSync(join(distAssets, file), join(outAssets, file));
}

console.log('已把绳网构建页发布到仓库根目录');
