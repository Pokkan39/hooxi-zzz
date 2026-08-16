import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT_TRACKED = process.argv.includes('--strict-tracked');
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.css'];
const PUBLIC_HTML = [
  'index.html',
  'mainline.html',
  'stories.html',
  'character.html',
  'faction.html',
  'events.html',
  'behind-scenes.html',
  'cultivate.html',
  'tape-wall-sample.html'
];
const ENTRY_HTML = ['events.html', 'create.html', 'edit.html'];
const REQUIRED_HTML = [...new Set([...PUBLIC_HTML, 'create.html', 'edit.html'])];
const errors = [];
const warnings = [];

const toRepoPath = (absolutePath) => path.relative(ROOT, absolutePath).split(path.sep).join('/');
const isFile = (absolutePath) => {
  try {
    return statSync(absolutePath).isFile();
  } catch {
    return false;
  }
};
const insideRoot = (absolutePath) => {
  const relative = path.relative(ROOT, absolutePath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const lineNumberAt = (text, index) => text.slice(0, index).split('\n').length;

function readRepoFile(relativePath, label = relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch (error) {
    errors.push(`${label} 无法读取：${error.message}`);
    return null;
  }
}

function checkRequiredHtml() {
  let present = 0;
  for (const relativePath of REQUIRED_HTML) {
    if (isFile(path.join(ROOT, relativePath))) {
      present += 1;
    } else {
      errors.push(`缺少必需 HTML：${relativePath}`);
    }
  }
  return { present, expected: REQUIRED_HTML.length };
}

function moduleEntriesFromHtml() {
  const entries = [];
  for (const htmlPath of ENTRY_HTML) {
    const source = readRepoFile(htmlPath, `入口 HTML ${htmlPath}`);
    if (source === null) continue;

    const localEntries = [];
    for (const match of source.matchAll(/<script\b[^>]*>/gi)) {
      const tag = match[0];
      const type = tag.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1];
      const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      if (type !== 'module' || !src) continue;
      if (!src.startsWith('./') && !src.startsWith('../')) {
        errors.push(`${htmlPath} 的模块入口不是静态相对路径：${src}`);
        continue;
      }
      const cleanSrc = src.split(/[?#]/, 1)[0];
      const absolutePath = path.resolve(path.dirname(path.join(ROOT, htmlPath)), cleanSrc);
      if (!insideRoot(absolutePath)) {
        errors.push(`${htmlPath} 的模块入口越出仓库：${src}`);
        continue;
      }
      if (!SOURCE_EXTENSIONS.includes(path.extname(absolutePath).toLowerCase())) {
        errors.push(`${htmlPath} 的模块入口扩展名不受支持：${src}`);
        continue;
      }
      localEntries.push(absolutePath);
    }

    if (localEntries.length === 0) {
      errors.push(`${htmlPath} 未找到静态相对 module 入口`);
    } else {
      entries.push(...localEntries);
    }
  }
  return entries;
}

function staticRelativeImports(source, extension) {
  const imports = new Set();
  const patterns = extension === '.css'
    ? [/@import\s+(?:url\(\s*)?["']([^"']+)["']/g]
    : [
        /\bimport\s+(?:[\w*$\s{},]+\s+from\s+)?["']([^"']+)["']/g,
        /\bexport\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
      ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('./') || specifier.startsWith('../')) imports.add(specifier);
    }
  }
  return [...imports];
}

function resolveSourceImport(importer, specifier) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  const basePath = path.resolve(path.dirname(importer), cleanSpecifier);
  if (!insideRoot(basePath)) {
    return { error: `${toRepoPath(importer)} 的 import 越出仓库：${specifier}` };
  }

  const explicitExtension = path.extname(basePath).toLowerCase();
  if (explicitExtension && !SOURCE_EXTENSIONS.includes(explicitExtension)) return { ignored: true };

  const candidates = explicitExtension
    ? [basePath]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => path.join(basePath, `index${extension}`))
      ];
  const resolved = candidates.find(isFile);
  if (resolved) return { resolved };
  return {
    error: `${toRepoPath(importer)} 缺少 import 依赖 ${specifier}（尝试：${candidates.map(toRepoPath).join(', ')}）`
  };
}

function buildImportGraph(entries) {
  const visited = new Set();
  const queue = [...entries];
  let importCount = 0;

  while (queue.length > 0) {
    const absolutePath = queue.shift();
    const relativePath = toRepoPath(absolutePath);
    if (visited.has(relativePath)) continue;
    visited.add(relativePath);

    if (!isFile(absolutePath)) {
      errors.push(`入口或依赖文件不存在：${relativePath}`);
      continue;
    }

    let source;
    try {
      source = readFileSync(absolutePath, 'utf8');
    } catch (error) {
      errors.push(`依赖文件无法读取：${relativePath}：${error.message}`);
      continue;
    }

    for (const specifier of staticRelativeImports(source, path.extname(absolutePath).toLowerCase())) {
      const result = resolveSourceImport(absolutePath, specifier);
      if (result.ignored) continue;
      importCount += 1;
      if (result.error) {
        errors.push(result.error);
      } else {
        queue.push(result.resolved);
      }
    }
  }

  return { files: visited, importCount };
}

function collectAssetReferences(graphFiles) {
  const assets = new Set();
  const dynamicHints = [];
  const literalPatterns = [
    { quote: "'", pattern: /'((?:\\.|[^'\\])*)'/g },
    { quote: '"', pattern: /"((?:\\.|[^"\\])*)"/g },
    { quote: '`', pattern: /`((?:\\.|[^`\\])*)`/g }
  ];
  const assetPattern = /(^|[^A-Za-z0-9_:])(\/assets\/[^\s"'`<>{}|\\^)\],;]+)/g;

  for (const relativePath of graphFiles) {
    const source = readFileSync(path.join(ROOT, relativePath), 'utf8');
    for (const { quote, pattern } of literalPatterns) {
      for (const literal of source.matchAll(pattern)) {
        const value = literal[1];
        if (!value.includes('/assets/')) continue;
        const before = source.slice(0, literal.index).trimEnd().at(-1);
        const after = source.slice(literal.index + literal[0].length).trimStart().at(0);
        const dynamic = (quote === '`' && value.includes('${')) || before === '+' || after === '+';
        if (dynamic) {
          dynamicHints.push(`${relativePath}:${lineNumberAt(source, literal.index)}`);
          continue;
        }
        for (const assetMatch of value.matchAll(assetPattern)) {
          let assetPath = assetMatch[2].split(/[?#]/, 1)[0];
          try {
            assetPath = decodeURIComponent(assetPath);
          } catch {
            errors.push(`${relativePath}:${lineNumberAt(source, literal.index)} 的资源 URL 无法解码：${assetPath}`);
            continue;
          }
          assets.add(assetPath.slice(1));
        }
      }
    }

    for (const match of source.matchAll(/url\(\s*(\/assets\/[^\s)'"?#]+)(?:[?#][^)]*)?\s*\)/g)) {
      let assetPath = match[1];
      try {
        assetPath = decodeURIComponent(assetPath);
      } catch {
        errors.push(`${relativePath}:${lineNumberAt(source, match.index)} 的资源 URL 无法解码：${assetPath}`);
        continue;
      }
      assets.add(assetPath.slice(1));
    }
  }

  let existing = 0;
  for (const assetPath of assets) {
    if (isFile(path.join(ROOT, assetPath))) {
      existing += 1;
    } else {
      errors.push(`入口 import 图引用的仓库资源不存在：/${assetPath}`);
    }
  }
  if (dynamicHints.length > 0) {
    warnings.push(`跳过 ${dynamicHints.length} 处无法静态确定的 /assets/ 动态模板：${dynamicHints.join(', ')}`);
  }
  return { assets, existing, dynamicCount: dynamicHints.length };
}

function checkViteConfig() {
  const source = readRepoFile('vite.config.js');
  if (source === null) return false;
  let ok = true;
  if (!/\bbase\s*:\s*(["'])\.\/\1/.test(source)) {
    errors.push("vite.config.js 缺少 base: './'");
    ok = false;
  }
  for (const entry of ['events', 'create', 'edit']) {
    const entryPattern = new RegExp(`["']?${entry}["']?\\s*:\\s*resolve\\([^)]*["']${entry}\\.html["']`);
    if (!entryPattern.test(source)) {
      errors.push(`vite.config.js 缺少 ${entry}.html 构建入口`);
      ok = false;
    }
  }
  return ok;
}

function checkWorkflow() {
  const source = readRepoFile('.github/workflows/pages.yml');
  if (source === null) return false;
  let ok = true;
  const buildIndex = source.indexOf('npm run build -- --config vite.config.js');
  const strictIndex = source.indexOf('npm run test:deploy -- --strict-tracked');
  if (buildIndex < 0 || strictIndex < 0 || strictIndex < buildIndex) {
    errors.push('pages workflow 必须在 build 后运行 npm run test:deploy -- --strict-tracked');
    ok = false;
  }
  if (!/uses:\s*actions\/upload-pages-artifact@[^\n]+[\s\S]{0,300}?path:\s*_site\s*(?:#.*)?$/m.test(source)) {
    errors.push('pages workflow 必须上传 _site');
    ok = false;
  }
  if (/uses:\s*actions\/upload-pages-artifact@[^\n]+[\s\S]{0,300}?path:\s*dist\b/m.test(source)) {
    errors.push('pages workflow 不能上传纯 dist');
    ok = false;
  }
  const tarLine = source.match(/^\s*tar\s+[^\n]*$/m)?.[0] ?? '';
  for (const exclusion of [".git", 'node_modules', 'dist', '_site']) {
    if (!tarLine.includes(`--exclude='./${exclusion}'`) && !tarLine.includes(`--exclude="./${exclusion}"`)) {
      errors.push(`pages workflow 的完整静态复制缺少 ${exclusion} 排除项`);
      ok = false;
    }
  }
  if (!/tar\s+[^\n]*-cf\s+-\s+\.\s*\|\s*tar\s+-xf\s+-\s+-C\s+_site/.test(source)) {
    errors.push('pages workflow 缺少从仓库根目录到 _site 的完整静态复制');
    ok = false;
  }
  if (!/^\s*cp\s+-a\s+dist\/\.\s+_site\/?\s*$/m.test(source)) {
    errors.push('pages workflow 缺少 dist 覆盖到 _site');
    ok = false;
  }
  return ok;
}

function checkBuiltHtml() {
  let present = 0;
  let checkedUrls = 0;
  for (const htmlPath of ENTRY_HTML) {
    const relativePath = `dist/${htmlPath}`;
    const source = readRepoFile(relativePath, `构建产物 ${relativePath}`);
    if (source === null) continue;
    present += 1;

    if (/(?:^|["'(=])\/?src\/[^\s"'<>?#]+\.jsx(?:[?#][^\s"'<>]*)?/i.test(source)) {
      errors.push(`${relativePath} 仍包含 src/*.jsx 源码入口`);
    }

    for (const tagMatch of source.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
      const tag = tagMatch[0];
      const url = tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (!url) continue;
      const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
      const pathname = url.split(/[?#]/, 1)[0].toLowerCase();
      const relevant = pathname.endsWith('.js') || pathname.endsWith('.css') || rel.split(/\s+/).includes('icon');
      if (!relevant) continue;
      checkedUrls += 1;
      if (url.startsWith('/')) errors.push(`${relativePath} 包含根绝对 JS/CSS/favicon URL：${url}`);
    }
  }
  return { present, expected: ENTRY_HTML.length, checkedUrls };
}

function checkTracked(requiredFiles) {
  const result = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`无法读取 Git 跟踪清单：${result.stderr.trim() || `退出码 ${result.status}`}`);
    return { untracked: [], tracked: 0 };
  }
  const trackedFiles = new Set(result.stdout.split('\0').filter(Boolean).map((file) => file.replaceAll('\\', '/')));
  const existingRequired = [...requiredFiles].filter((file) => isFile(path.join(ROOT, file))).sort();
  const untracked = existingRequired.filter((file) => !trackedFiles.has(file));
  if (untracked.length > 0) {
    const prefix = STRICT_TRACKED ? '严格跟踪失败' : '存在但未跟踪的必需源文件';
    const detail = untracked.length <= 20
      ? untracked.join(', ')
      : `${untracked.slice(0, 20).join(', ')}，另有 ${untracked.length - 20} 个`;
    const message = `${prefix}（${untracked.length}）：${detail}`;
    if (STRICT_TRACKED) errors.push(message);
    else warnings.push(message);
  }
  return { untracked, tracked: existingRequired.length - untracked.length, required: existingRequired.length };
}

function main() {
  const htmlStats = checkRequiredHtml();
  const entries = moduleEntriesFromHtml();
  const graph = buildImportGraph(entries);
  const assetStats = collectAssetReferences(graph.files);
  const viteOk = checkViteConfig();
  const workflowOk = checkWorkflow();
  const buildStats = checkBuiltHtml();

  const requiredSources = new Set([
    ...REQUIRED_HTML,
    ...graph.files,
    ...assetStats.assets,
    'package.json',
    'vite.config.js',
    '.github/workflows/pages.yml',
    'scripts/check-deploy-tracking.mjs'
  ]);
  if (existsSync(path.join(ROOT, 'package-lock.json'))) requiredSources.add('package-lock.json');
  const trackedStats = checkTracked(requiredSources);

  console.log(`部署门禁（Git 跟踪模式：${STRICT_TRACKED ? 'strict' : 'warning'}）`);
  console.log(`  HTML：${htmlStats.present}/${htmlStats.expected}`);
  console.log(`  import 图：${entries.length} 个入口，${graph.files.size} 个文件，${graph.importCount} 条相对依赖`);
  console.log(`  /assets/：${assetStats.existing}/${assetStats.assets.size} 个静态资源，跳过动态模板 ${assetStats.dynamicCount} 处`);
  console.log(`  Vite/workflow：${viteOk ? '通过' : '失败'}/${workflowOk ? '通过' : '失败'}`);
  console.log(`  dist HTML：${buildStats.present}/${buildStats.expected}，检查 URL ${buildStats.checkedUrls} 个`);
  console.log(`  Git：必需文件 ${trackedStats.required ?? 0}，已跟踪 ${trackedStats.tracked}，未跟踪 ${trackedStats.untracked.length}`);

  for (const warning of warnings) console.warn(`WARNING ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR ${error}`);
    console.error(`DEPLOY_GATE_FAIL：${errors.length} 个错误，${warnings.length} 个警告`);
    process.exitCode = 1;
    return;
  }
  console.log(`DEPLOY_GATE_OK：0 个错误，${warnings.length} 个警告`);
}

try {
  main();
} catch (error) {
  console.error(`DEPLOY_GATE_FAIL：未处理异常：${error.stack || error.message}`);
  process.exitCode = 2;
}
