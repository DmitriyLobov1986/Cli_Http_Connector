// system
import { readFile } from 'node:fs/promises'

// utils
import lodash from 'lodash'

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
 * Создаёт массив фильтров для паралелльных запросов
 * @param {string} filtPath  путь к файлу фильтров
 * @returns {Promise<Array>} массив фильтров
 */
const filtChunk = async (filtPath) => {
  const loopData = await readFile(filtPath, 'utf-8')
  const loopArr = loopData.split('\n')
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
  const strArr = str.split(delimiter)
  const newStrArr = strArr.map((v) =>
    v
      .replace(/(?<=^\r\n)"|^"|"$/g, '')
      .replace(new RegExp(String.fromCharCode(160), 'g'), '')
      .replace(/^Да$/, 'true')
      .replace(/^Нет$/, 'false')
  )
  return newStrArr.join(delimiter)
}

export { dateTime1C, getFieldsData, filtChunk, customTransform }
