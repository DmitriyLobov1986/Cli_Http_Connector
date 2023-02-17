// system
import { readFile } from 'node:fs/promises'

// utils
import lodash from 'lodash'
import encoding from 'encoding'

// #region 1C

/**
 * Перевод даты из строки в формат 1С Или ISO
 * @param {string} date дата в строке
 * @returns {String} дата в нужном формате
 */
const dateTime1C = (date, format = '1C') => {
  const dateTime = new Date(date)

  if (format === '1C') {
    return `ДАТАВРЕМЯ(${dateTime.getFullYear()}, ${
      dateTime.getMonth() + 1
    }, ${dateTime.getDate()})`
  }
  return dateTime.toISOString()
}

/**
 * Корректировка имён и типов полей для запроса 1С
 * @param {String} name
 * @param {String} dataType
 */
const getFieldsData = (name, dataType) => {
  // @ts-ignore
  const alias = name.replaceAll('.', '')

  if (name.includes('Ссылка')) {
    name = `ПРЕДСТАВЛЕНИЕ(${name})`
  } else if (name.includes('Порядок')) {
    dataType = 'dtFloat'
  }

  return { name, alias, dataType }
}

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
        const field = v.split('КАК')[1]
        if (field) {
          alias.push(field.replace(/[\s\r,]/gi, ''))
        }
      })

    if (alias.length) break
  }

  return alias
}

/**
 * Создаёт массив фильтров для паралелльных запросов
 * @param {string} filtPath  путь к файлу фильтров
 * @returns {Promise<Array>} массив фильтров
 */
const filtChunk = async (filtPath) => {
  // read and convert
  const buffer = await readFile(filtPath)
  const loop = encoding.convert(buffer, 'utf-8', 'windows-1251').toString()

  const loopArr = loop.split('\n').slice(2)
  // const grSize = Math.ceil(loopArr.length / 10)
  return lodash.chunk(loopArr, 2)
}

// #endregion

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
  const newStrArr = strArr.map((v) => v
    .replace(/(?<=^\r\n)"|^"|"$/g, '')
    .replace(new RegExp(String.fromCharCode(160), 'g'), '')
    .replace(/^Да$/, 'true')
    .replace(/^Нет$/, 'false'))
  return newStrArr.join(delimiter)
}

export { dateTime1C, getFieldsData, filtChunk, customTransform, getQueryFields }
