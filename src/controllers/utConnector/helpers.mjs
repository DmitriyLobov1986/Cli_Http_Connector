// system
import { readFileSync } from 'node:fs'
import path from 'node:path'

// args
import argv from '../yargs/index.mjs'

// utils
import lodash from 'lodash'
import encoding from 'encoding'

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
      .split('ИЗ')[0]
      .split(',')
      .forEach((v) => {
        const field = v.split('КАК')[1] ?? v.split('.').slice(1).join()
        alias.push(field.replace(/[\s\r,.]/gi, ''))
      })

    if (alias.length) break
  }

  return alias
}

/**
 * Создаёт массив фильтров для паралелльных запросов
 * @param {string} query  текст запроса
 * @returns {Array} массив фильтров
 */
const getQueryChunks = (query) => {
  if (!query.includes('&loop')) return ['']

  // read and convert
  const loop = path.join(path.dirname(argv.path), 'ut', 'loop.csv')
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
 * Удаляет кавычки в начале и конце полей
 * @param {String} str строка csv
 * @param {String} delimiter разделитель
 * @returns {String} отформатированная строка
 */
const customTransform = (str, delimiter) => {
  // Добавляем перенос (если надо)
  str = str[0] === '\r' ? str : `\r\n${str}`

  // форматируем
  const strArr = str.split(delimiter)
  const newStrArr = strArr.map((v) =>
    v
      .replace(/(?<=^\r\n)"|^"|"$|(?<=.)[\r\n]/g, '')
      .replace(new RegExp(String.fromCharCode(160), 'g'), '')
      .replace(/^Да$/, 'true')
      .replace(/^Нет$/, 'false')
  )
  return newStrArr.join(delimiter)
}

export { getQueryChunks, customTransform, getQueryFields }
