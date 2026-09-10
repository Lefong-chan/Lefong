// Regenerates bookmarklet.txt from extract.js. Run after any edit to
// extract.js: `node build.mjs` (from inside bookmarklet/, or `node
// bookmarklet/build.mjs` from the repo root).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(dir, 'extract.js'), 'utf8')

// Joined with real newlines, not spaces or stripped entirely - the
// source relies on automatic semicolon insertion at line breaks (e.g.
// `return null` on its own line), which only fires at actual newlines,
// not just any whitespace. A javascript: URI can contain literal
// newlines fine.
const minified = source
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .map((line) => line.trim())
  .filter(Boolean)
  .join('\n')

const bookmarklet = `javascript:${minified}`

writeFileSync(
  join(dir, 'bookmarklet.txt'),
  `Raw (try this first - paste as the bookmark's URL):\n\n${bookmarklet}\n\n` +
    `URL-encoded (use this instead if your browser mangles the raw version - e.g. strips quotes):\n\n` +
    `javascript:${encodeURIComponent(minified)}\n`
)

console.log(`Wrote bookmarklet.txt (${bookmarklet.length} chars raw)`)
