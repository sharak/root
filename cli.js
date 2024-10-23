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
  if (clearSourceId) {
    delete entry._stats?.compendiumSource
    delete entry.flags?.core?.sourceId
  }
  delete entry.flags?.importSource
  delete entry.flags?.exportSource
  if (entry._stats?.lastModifiedBy) entry._stats.lastModifiedBy = 'rloriteexporter0'
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

    const folders = {}
    const containers = {}
    await extractPack(packPath, destPath, {
      log: false,
      transformEntry: (e) => {
        if (e._key.startsWith('!folders'))
          folders[e._id] = { name: slugify(e.name), folder: e.folder }
        else if (e.type === 'container')
          containers[e._id] = {
            name: slugify(e.name),
            container: e.system?.container,
            folder: e.folder,
          }
        return false
      },
    })
    const buildPath = (collection, entry, parentKey) => {
      let parent = collection[entry[parentKey]]
      entry.path = entry.name
      while (parent) {
        entry.path = path.join(parent.name, entry.path)
        parent = collection[parent[parentKey]]
      }
    }
    Object.values(folders).forEach((f) => buildPath(folders, f, 'folder'))
    Object.values(containers).forEach((c) => {
      buildPath(containers, c, 'container')
      const folder = folders[c.folder]
      if (folder) c.path = path.join(folder.path, c.path)
    })
    await extractPack(packPath, destPath, {
      yaml: true,
      transformEntry: (entry) => cleanEntry(entry),
      transformName: (entry) => {
        if (entry._id in folders) return path.join(folders[entry._id].path, '_folder.yaml')
        if (entry._id in containers) return path.join(containers[entry._id].path, '_container.yaml')
        const outputName = slugify(entry.name)
        const parent = containers[entry.system?.container] ?? folders[entry.folder]
        return path.join(parent?.path ?? '', `${outputName}.yaml`)
      },
    })
  }
}

async function compileCompendiums() {
  const folders = fs
    .readdirSync(COMPENDIUM_SOURCE, { withFileTypes: true })
    .filter((file) => file.isDirectory())

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
