// #region imports
// system
import { readdir, mkdir, unlink } from 'node:fs/promises'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import process from 'process'
import readline from 'readline'

// my Classes
import Deductor from './controllers/deductor.mjs'
import UtConnector from './controllers/utConnector/utConnector.mjs'

// logger
import logger from './controllers/logger/index.mjs'
import nsTable from 'nodestringtable'

// params
import minimist from 'minimist'

// utils
import colors from 'ansi-colors'

// #endregion

// Интерфейс
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Переменные запуска
let {
  n: node,
  p: filePath,
  q: query,
  qFile = false,
  qParams,
  log,
} = minimist(process.argv.slice(2))

/**
 * Обработчик ошибок
 * @param {Error} error
 */
function errorHandler(error) {
  if (!log) {
    logger.error(error)
    rl.question('\n Press enter', () => rl.close())
  } else {
    logger.logInFile('error', `${filePath}\n${error.stack}`, './log.log')
    process.exitCode = 1
    rl.close()
  }
}

const convertImports = async () => {
  const filesSrc = path.join(process.cwd(), 'files')
  const files = await readdir(filesSrc)

  const promisesArr = files.map(async (file) => {
    if (path.extname(file) !== '.ded') return
    //
    const pathIn = path.join(process.cwd(), 'files', file)
    const pathOut = path.join(process.cwd(), 'files/out', file)
    //

    const deductor = new Deductor()
    await deductor.initialize(pathIn)

    if (deductor.convertXml()) {
      await deductor.writeXml(pathOut)
    }
  })

  await Promise.all(promisesArr)

  rl.question('\n Press enter', () => rl.close())
}

/**
 * Получение текста запроса из узла импорта Deductor
 * Получение данных из Http ut
 */
const utImport = async () => {
  const deductor = new Deductor()

  if (qFile) {
    query = readFileSync('./files/query.txt', 'utf-8')
  }

  if (!qParams) {
    qParams = []
  } else {
    switch (typeof qParams) {
      case 'string':
        qParams = JSON.parse(qParams)
        break
      default:
        await deductor.initialize(filePath)
        qParams = deductor.formQueryParams()
    }
  }

  if (!query) {
    await deductor.initialize(filePath)
    query = deductor.getQueryTextByNode(node)
  }
  //------------------------------------------------------
  const output = path.join(path.dirname(filePath), 'ut', `${node}.csv`)
  await mkdir(path.dirname(output), { recursive: true })

  if (existsSync(output)) {
    await unlink(output)
  }
  //------------------------------------------------------
  logger.logInFile(
    'info',
    `\n\n ${colors.bold.blue('Текст запроса:')} \n\n ${query} \n ${nsTable(
      qParams
    )}`,
    output.replace('.csv', '.log')
  )
  //------------------------------------------------------
  const utConnector = new UtConnector({}, output)
  await utConnector.getDataToCsv(query, qParams)
}

if (node && (filePath || query || qFile)) {
  utImport()
    .then(() => {
      rl.close()
    })
    .catch(errorHandler)
} else {
  convertImports().catch(errorHandler)
}
