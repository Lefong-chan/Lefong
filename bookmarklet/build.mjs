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

// URL-encoded, not the raw multi-line form: a mobile bookmark's URL field
// is a single-line box, and pasting real newlines into one is what a
// prior real attempt seems to have silently swallowed. Percent-encoding
// keeps everything on one line with no character a form field would try
// to "clean up" (quotes, newlines, etc.) - browsers decode a javascript:
// bookmark's URL before running it, so this behaves identically to the
// raw form once tapped.
const bookmarklet = `javascript:${encodeURIComponent(minified)}`

// bookmarklet.txt holds nothing but this one line on purpose - it's
// meant to be selected and copied whole, with no surrounding text to
// accidentally include or have to strip out first.
writeFileSync(join(dir, 'bookmarklet.txt'), bookmarklet)

console.log(`Wrote bookmarklet.txt (${bookmarklet.length} chars)`)
