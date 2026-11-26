// Runs a tool script (`node tool/run.ts tool/import-dev-to.ts`) through the
// module runner of Vite, so it resolves its imports the way the app and the
// build do: fp-ts has no `exports` map, so plain Node cannot load
// `fp-ts/Either`. Only `vite` is imported here, which Node loads as is.
import { runnerImport } from 'vite'

const [script] = process.argv.slice(2)

if (script === undefined) {
  console.error('Usage: node tool/run.ts <script.ts>')
  process.exitCode = 1
} else {
  await runnerImport(`./${script}`, { configFile: false, logLevel: 'error' })
}
