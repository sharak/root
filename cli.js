import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli'
import fs from 'fs'
import path from 'path'
import logger from 'fancy-log'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const COMPENDIUM_SOURCE = 'packs/_source'
const COMPENDIUM_DEST = 'packs'
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace("'", '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+|-{2,}/g, '-')
}

function cleanEntry(entry, { clearSourceId = true, ownership = 0 } = {}) {
  if (entry.ownership) entry.ownership = { default: ownership }
  if (clearSourceId) delete entry.flags?.core?.sourceId
  delete entry.flags?.importSource
  delete entry.flags?.exportSource
  if (entry._stats?.lastModifiedBy) entry._stats.lastModifiedBy = 'rlorite_exporter'
  if (!entry.flags) entry.flags = {}
  Object.entries(entry.flags).forEach(([key, contents]) => {
    if (Object.keys(contents).length === 0) delete entry.flags[key]
  })

  if (entry.effects) entry.effects.forEach((i) => cleanEntry(i, { clearSourceId: false }))
}

async function extractCompendiums() {
  const system = JSON.parse(fs.readFileSync('./module.json', { encoding: 'utf-8' }))

  for (const pack of system.packs) {
    const destPath = path.join(COMPENDIUM_SOURCE, pack.name)
    const packPath = pack.path || `packs/${pack.name}`
    logger.info(`Extrayendo el compendio ${pack.label}`)
    await extractPack(packPath, destPath, {
      yaml: true,
      transformEntry: (entry) => cleanEntry(entry),
      transformName: (entry) => {
        return `${slugify(entry.name)}.yaml`
      },
    })
  }
}

async function compileCompendiums() {
  const folders = fs.readdirSync(COMPENDIUM_SOURCE, { withFileTypes: true })

  for (const folder of folders) {
    const src = path.join(COMPENDIUM_SOURCE, folder.name)
    const dest = path.join(COMPENDIUM_DEST, folder.name)
    logger.info(`Compilando el compendio ${folder.name}`)
    await compilePack(src, dest, {
      recursive: true,
      yaml: true,
      log: true,
      transformEntry: cleanEntry,
    })
  }
}

yargs(hideBin(process.argv))
  .command({
    command: 'compendium [action]',
    describe: 'Compilar y extraer compendios',
    builder: (yargs) => {
      yargs.positional('action', {
        describe: 'La acción que se desea ejecutar sobre los compendios',
        type: 'string',
        choices: ['compile', 'extract'],
      })
    },
    handler: async (argv) => {
      const { action } = argv
      switch (action) {
        case 'extract':
          return await extractCompendiums()
        case 'compile':
          return await compileCompendiums()
      }
    },
  })
  .parse()
