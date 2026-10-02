/**
 * Typechecks the code people copy: every ```tsx and ```ts block in the two
 * READMEs and the docs pages, compiled with `strict` against the built
 * package, the way an app would see it.
 *
 *   node scripts/check-doc-examples.mjs           check (exit 1 on any error)
 *   node scripts/check-doc-examples.mjs --keep    also keep the generated files
 *
 * Docs examples are excerpts, so each block is completed before it is
 * compiled, and only as far as an excerpt needs:
 *
 * - a block that is JSX alone (`<BookMockup>…</BookMockup>`) is wrapped in a
 *   fragment;
 * - a library export the block uses but does not import is imported, from the
 *   main entry, or from `/core` if only that has it;
 * - a PascalCase name the block uses but never defines (`<YourApp />`,
 *   `<CoverArt />`) is declared as `any`, since it stands for the reader's own
 *   code.
 *
 * Everything else must compile as written: a prop the types reject, a wrong
 * export name, a region that does not exist, an undefined lowercase variable.
 * Those are the mistakes that shipped in the docs before this check existed.
 *
 * A block that cannot compile on purpose (a shell session, an error shown as
 * an example of what not to write) opts out with `nocheck` in its fence:
 * ```tsx nocheck
 *
 * It reads the built package, so run `npm run build -w react-3d-mockups` first.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const docs = join(here, '..')
const repo = join(docs, '..', '..')
const pkg = join(repo, 'packages', 'react')
// Under node_modules: outside every tsconfig's `include`, and resolving
// `react-3d-mockups`, react and three the way an app in this repo does.
const out = join(repo, 'node_modules', '.cache', 'doc-examples')
const KEEP = process.argv.includes('--keep')
const requireFromRepo = createRequire(join(repo, 'package.json'))

/* ---------- What the package exports ---------- */

/** Value and type names a `.d.ts` bundle exports, from its `export { … }` lists. */
function exportedNames(dts) {
  const names = new Set()
  for (const block of readFileSync(dts, 'utf8').matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of block[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim()
      if (name) names.add(name)
    }
  }
  return names
}
const MAIN = exportedNames(join(pkg, 'dist', 'index.d.ts'))
const CORE = exportedNames(join(pkg, 'dist', 'core.d.ts'))

/* ---------- The blocks ---------- */

function mdxFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return mdxFiles(path)
    return name.endsWith('.mdx') ? [path] : []
  })
}

const SOURCES = [join(repo, 'README.md'), join(pkg, 'README.md'), ...mdxFiles(join(docs, 'content', 'docs'))]
const FENCE = /^([ \t]*)```(tsx|ts)\b([^\n]*)\n([\s\S]*?)\n\1```/gm

const blocks = []
for (const file of SOURCES) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(FENCE)) {
    const [, indent, lang, meta, body] = m
    if (/\bnocheck\b/.test(meta)) continue
    const line = text.slice(0, m.index).split('\n').length + 1
    const code = body
      .split('\n')
      .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l))
      .join('\n')
    blocks.push({ file, line, lang, code })
  }
}

/* ---------- Completing an excerpt ---------- */

const IDENT = /\b[A-Za-z_$][\w$]*\b/g
const JS_GLOBALS = new Set(['Map', 'Set', 'Array', 'Object', 'Promise', 'Math', 'JSON', 'Date', 'Number', 'String', 'Error', 'URL', 'Response', 'Request', 'Blob', 'File', 'Image', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLVideoElement', 'Record', 'Partial', 'Readonly', 'React', 'Intl', 'Boolean', 'Symbol', 'RegExp', 'Uint8Array', 'Buffer', 'TextEncoder', 'AbortController', 'IntersectionObserver', 'ResizeObserver', 'Parameters', 'ReturnType', 'Awaited', 'Pick', 'Omit', 'NonNullable', 'Exclude', 'Extract', 'Required', 'PropertyKey', 'CSSStyleDeclaration', 'Element', 'Document', 'Window', 'Event', 'MouseEvent', 'KeyboardEvent', 'PointerEvent'])

/** Strip strings and comments, so a name inside them is not taken for a use. */
function codeOnly(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
}

const RESERVED = new Set(
  'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return super switch this throw true try typeof var void while with yield await async of type as satisfies keyof readonly infer is unique declare'.split(' ')
)

/** Names the block itself brings into scope. */
function declared(source) {
  const names = new Set()
  const code = codeOnly(source)
  for (const m of code.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s/g)) {
    for (const n of m[2].replace(/[{}*]/g, ' ').split(/[\s,]+/)) {
      if (n && n !== 'as' && n !== 'type') names.add(n)
    }
  }
  const DECL = /\b(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g
  for (const m of code.matchAll(DECL)) names.add(m[1])
  // Destructured bindings: const { a, b: c } = …, function F({ a, b }) …
  for (const m of code.matchAll(/(?:const|let|var)\s*[{[]([^}\]=]*)[}\]]\s*=/g)) {
    for (const n of m[1].split(',')) {
      const name = n.split(':').pop().split('=')[0].trim().replace(/^\.\.\./, '')
      if (name) names.add(name)
    }
  }
  for (const name of names) if (RESERVED.has(name)) names.delete(name)
  return names
}

/** The hooks and components an excerpt calls without importing, by module. */
const IMPLICIT = new Map([
  ...Object.keys(requireFromRepo('react'))
    .filter((name) => /^(use[A-Z]|Suspense$|Fragment$|StrictMode$|forwardRef$|memo$|createContext$|startTransition$)/.test(name))
    .map((name) => [name, 'react']),
  ...['ReactNode', 'ReactElement', 'ComponentType', 'ComponentProps', 'CSSProperties', 'PropsWithChildren', 'RefObject'].map(
    (name) => [name, 'react']
  ),
  ...['useThree', 'useFrame', 'useLoader', 'Canvas'].map((name) => [name, '@react-three/fiber']),
])

/** Whether a bare module specifier resolves from the repo, as it would in an app that installed it. */
function installed(specifier) {
  try {
    requireFromRepo.resolve(specifier)
    return true
  } catch {
    return false
  }
}

/**
 * An import of the reader's own file (`./hero`) or of a package this repo does
 * not install (`remotion`) becomes declarations of the names it brings in.
 */
function stubImport(line) {
  const m = line.match(/^import\s+(type\s+)?(.*?)\s+from\s+['"]([^'"]+)['"];?\s*$/)
  if (!m) return null
  const [, typeOnly, clause, specifier] = m
  const bareSpecifier = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
  if (!specifier.startsWith('.') && installed(specifier.startsWith('.') ? specifier : bareSpecifier)) return null
  const names = clause
    .replace(/[{}]/g, ' ')
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.replace(/^\*\s+as\s+/, ''))
    .filter(Boolean)
  return names.map((name) => (typeOnly ? `type ${name} = any` : `declare const ${name}: any`)).join('; ')
}

function complete(block, earlier) {
  const { code, lang } = block
  const bare = codeOnly(code)
  const own = declared(code)
  const used = new Set(bare.match(IDENT) ?? [])
  const imports = new Map()
  const stubs = []
  const take = (module, name) => imports.set(module, [...(imports.get(module) ?? []), name])
  for (const name of used) {
    if (own.has(name) || JS_GLOBALS.has(name) || RESERVED.has(name)) continue
    if (MAIN.has(name)) take('react-3d-mockups', name)
    else if (CORE.has(name)) take('react-3d-mockups/core', name)
    else if (IMPLICIT.has(name)) take(IMPLICIT.get(name), name)
    // Defined by an earlier block on the same page: the page reads in order.
    else if (earlier.has(name)) stubs.push(name)
    // A PascalCase name used as a tag or a value stands for the reader's code.
    else if (/^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name)) stubs.push(name)
  }

  const head = [
    ...[...imports].map(([module, names]) => `import { ${names.join(', ')} } from '${module}'`),
    ...stubs.map((name) => `declare const ${name}: any`),
  ]

  // Each output line carries the block line it came from (0 for added lines),
  // so an error maps back to the docs.
  const src = code.split('\n').map((text, i) => ({
    // `import('./mockup')` loads the reader's own file, which is not here.
    text: (stubImport(text) ?? text).replace(/\bimport\((['"])\.{1,2}\/[^'"]*\1\)/g, 'Promise.resolve<any>(null)'),
    from: i + 1,
  }))
  const added = (text) => ({ text, from: 0 })
  // A leading directive stays first, where it means something.
  const directive = /^(['"])use (client|server)\1;?$/.test(src[0]?.text.trim() ?? '') ? [src.shift()] : []

  /*
   * An excerpt may show JSX at the top level, after any statements it needs:
   * `<BookMockup>…</BookMockup>`, or several siblings with `//` comments
   * between them. Everything from the first line that opens a tag at column
   * 0 becomes the body of one fragment, its column-0 comments JSX comments.
   */
  let body = src
  const firstTag = lang === 'tsx' ? src.findIndex((l) => /^<[A-Za-z>]/.test(l.text)) : -1
  if (firstTag !== -1) {
    // Comments directly above the first tag describe it; keep them with it.
    let start = firstTag
    while (start > 0 && /^\/\//.test(src[start - 1].text)) start--
    const jsx = src.slice(start).map((l) =>
      /^\/\//.test(l.text) ? { ...l, text: `{/* ${l.text.replace(/^\/\/\s?/, '')} */}` } : l
    )
    body = [...src.slice(0, start), added('export const __example = (<>'), ...jsx, added('</>)')]
  } else {
    body = [...src, added('export {}')]
  }
  return [...directive, ...head.map(added), ...body]
}

/* ---------- Compile ---------- */

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const index = new Map()
const earlier = new Map()
blocks.forEach((block, i) => {
  const name = `example-${String(i).padStart(3, '0')}.${block.lang}`
  const seen = earlier.get(block.file) ?? new Set()
  const lines = complete(block, seen)
  earlier.set(block.file, new Set([...seen, ...declared(block.code)]))
  writeFileSync(join(out, name), lines.map((l) => l.text).join('\n') + '\n')
  index.set(name, { ...block, lines })
})
writeFileSync(
  join(out, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['dom', 'dom.iterable', 'esnext'],
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        allowImportingTsExtensions: true,
        types: ['node'],
      },
      include: ['*.ts', '*.tsx'],
    },
    null,
    2
  )
)

const tsc = requireFromRepo.resolve('typescript/bin/tsc')
let output = ''
try {
  execFileSync(process.execPath, [tsc, '-p', out, '--pretty', 'false'], { encoding: 'utf8', stdio: 'pipe' })
} catch (error) {
  output = String(error.stdout ?? '') + String(error.stderr ?? '')
}

const errors = []
for (const line of output.split('\n')) {
  const m = line.match(/(example-\d+\.tsx?)\((\d+),(\d+)\): (error TS\d+: .*)$/)
  if (!m) {
    if (line.trim()) errors.push({ where: '(tsc)', message: line })
    continue
  }
  const block = index.get(m[1])
  const from = block.lines[Number(m[2]) - 1]?.from || 1
  errors.push({ where: `${relative(repo, block.file)}:${block.line + from - 1}`, message: m[4], file: m[1] })
}

console.log(`Typechecked ${blocks.length} examples from ${SOURCES.length} files.`)
if (errors.length) {
  for (const e of errors) console.error(`  ${e.where}  ${e.message}${KEEP && e.file ? `  [${e.file}]` : ''}`)
  console.error(`\n${errors.length} error(s) in docs examples.${KEEP ? ` Generated files: ${out}` : ' Re-run with --keep to inspect the generated files.'}`)
  process.exitCode = 1
} else {
  console.log('Every example compiles.')
}
if (!KEEP) rmSync(out, { recursive: true, force: true })
