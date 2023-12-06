// system
import { readFileSync } from 'node:fs'
import path from 'node:path'

// args
import argv from '../yargs/index.mjs'

// utils
import lodash from 'lodash'
import encoding from 'encoding'
import moment from 'moment'

/**
 * Получение массива полей запроса
 * @param {string} query текст запроса
 * @returns {Array<string>} массив полей запроса
 */
const getQueryFields = (query) => {
  const blocks = query.split('ВЫБРАТЬ')
  const alias = []

  for (let index = blocks.length; index >= 1; index--) {
    blocks[index - 1]
      .split('ИЗ')
      .shift()
      .split(',')
      .forEach((v) => {
        const field = v.split('КАК').pop().split('.')
        alias.push(
          field
            .slice(Math.min(1, field.length - 1))
            .join()
            .replace(/[\s\r,.]/gi, '')
        )
      })

    if (alias.length) break
  }

  return alias
}

/**
 * divide content in chunks by rows
 * @param {string} filePath file path
 * @param {number} size rows in one chunk
 * @param {string} delimiter
 * @returns {Array<string>}
 */
const readFileToChunks = (filePath, size, delimiter = '\r\n') => {
  const buffer = readFileSync(filePath)
  return lodash.chunk(
    encoding
      .convert(buffer, 'utf-8', 'windows-1251')
      .toString()
      .split(delimiter)
      .slice(1, -1),
    size
  )
}

/**
 * Создаёт карту фильтров для паралелльных запросов (ключ - запрос, значение - массив параметров)
 * @param {string} query  текст запроса
 * @returns {Map} карта фильтров
 */
const getQueryChunks = (query) => {
  let queryMap = new Map()
  queryMap.set(query, [])

  // multiload pattern
  const multiPatrn = /(?<=@)(lp_.+?)_(set|val)_(\d+)_(\d+)(?=@)/g
  const result = query.matchAll(multiPatrn)

  // unique files
  const files = new Map()
  for (const file of result) {
    const chunk = file[2] === 'set' ? +file[3] : 1
    const key = `${file[1]}_${chunk}`

    let fileData = files.get(key)
    if (!fileData) {
      fileData = new Set()
      files.set(key, fileData)
    }
    fileData.add(file[1])
    fileData.add(file[2])
    fileData.add(chunk)
    fileData.add(file[4])
  }

  // unique queries
  files.forEach((value) => {
    const [name, type, chunk, ...fields] = [...value]
    const filePath = path.join(path.dirname(argv.path), 'ut', `${name}.csv`)
    const res = readFileToChunks(filePath, chunk)

    const setQueryArr = (queryExp, prms, acc) => {
      res.forEach((line) => {
        let queryMod = queryExp
        const queryModPrms = [...prms]
        let repl = ''

        for (const field of fields) {
          const pattern = `@${name}_${type}_${chunk}_${field}@`
          switch (type) {
            case 'set':
              repl = line.map((str) => str.split('\t')[+field - 1])
              break
            default:
              repl = line[0].split('\t')[[+field - 1]]
              break
          }
          queryMod = queryMod.replaceAll(pattern, repl)
          queryModPrms.push(repl)
        }
        acc.set(queryMod, queryModPrms)
      })
    }

    const acc = new Map()
    queryMap.forEach((prms, q) => setQueryArr(q, prms, acc))
    queryMap = acc
  })

  return queryMap
}

// #region formatters
const customStringFormatter = (item) => {
  const itemMod = item.replace(/\t/g, '_')
  const day = moment(itemMod, 'YYYY-MM-DDTHH:mm:ss', true)
  return day.isValid() ? day.format('DD.MM.YYYY') : itemMod
}

// #endregion

export { getQueryChunks, customStringFormatter, getQueryFields }
