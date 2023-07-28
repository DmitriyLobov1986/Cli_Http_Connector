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
 * Создаёт массив фильтров для паралелльных запросов
 * @param {string} query  текст запроса
 * @param {import('./types').qParams} qParams параметры запроса
 * @returns {Array} массив фильтров
 */
const getQueryChunks = (query, qParams) => {
  if (!query.includes('&loop')) return ['']

  // check loop in qParams
  let loop = lodash.find(qParams, (o) => o.Имя === 'loop')
  if (loop) {
    return lodash.chunk(
      loop.Значение.value.map((v) => `"${v}"`),
      loop.Значение.size
    )
  }

  // check loop in file
  loop = path.join(path.dirname(argv.path), 'ut', 'loop.csv')
  const buffer = readFileSync(loop)

  return lodash.chunk(
    encoding
      .convert(buffer, 'utf-8', 'windows-1251')
      .toString()
      .split('\r\n')
      .slice(1)
      .map((v) => `"${v}"`),

    argv.loop
  )
}

/**
 * Форматирует значения полей объекта
 * @param {object} item
 * @returns {object} отформотированный объект
 */
const customTransform = (item) => {
  const modArr = Object.entries(item).map(([k, v]) => {
    if (typeof v !== 'string') {
      return [k, v]
    }

    const transValue = v
      // .replace(/(?<=^\r\n)"|^"|"$|(?<=.)[\r\n]/g, '')
      .replace(/[\r\n\t]/g, '')
      .replace(new RegExp(String.fromCharCode(160), 'g'), '')
      .replace(/^Да$/, 'true')
      .replace(/^Нет$/, 'false')
    const day = moment(transValue, 'YYYY-MM-DDTHH:mm:ss', true)
    return [k, day.isValid() ? day.format('DD.MM.YYYY') : transValue]
  })

  return Object.fromEntries(modArr)
}

export { getQueryChunks, customTransform, getQueryFields }
