// Precompiles the prototype .jsx files to plain .js so the browser doesn't
// have to run Babel-standalone on every page load. Run with `npm run build:jsx`.
//
// Each file is transformed individually (no bundling) so the existing
// global-scope sharing between scripts is preserved exactly — the .js outputs
// load as classic <script> tags in the same order the .jsx did.
import esbuild from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

const FILES = [
  'sw/atoms',
  'sw/today',
  'sw/detail',
  'sw/neuro',
  'sw/app',
  'frames/ios-frame',
  'fam/famapp',
  'elder/call',
]

for (const f of FILES) {
  const src = readFileSync(`${f}.jsx`, 'utf8')
  const { code } = esbuild.transformSync(src, {
    loader: 'jsx',
    jsx: 'transform', // classic runtime -> React.createElement, uses the global React (UMD)
    target: 'es2018',
  })
  const banner = `// AUTO-GENERATED from ${f}.jsx by \`npm run build:jsx\` — edit the .jsx, not this file.\n`
  writeFileSync(`${f}.js`, banner + code)
  console.log('built', `${f}.js`)
}
