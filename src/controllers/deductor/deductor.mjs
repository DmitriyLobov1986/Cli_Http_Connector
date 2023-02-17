/* eslint-disable no-console */
// #region imports

// system
import { readFile, writeFile, rm } from 'node:fs/promises'
import { readFileSync } from 'fs'
import { promisify } from 'util'
import { resolve, join, dirname } from 'path'
import { cwd } from 'process'
import { exec } from 'child_process'

// parcer
import xml2js from 'xml2js'

// utils
import { dateTime1C, getFieldsData } from './utils.mjs'
import logger from '../logger/index.mjs'

// #endregion

// Парсер
const parcer = new xml2js.Parser()
const builder = new xml2js.Builder()

class Deductor {
  constructor() {
    // Настройки
    const path = resolve(cwd(), 'config.json')
    const jsonString = readFileSync(path, 'utf8')
    this.meta = JSON.parse(jsonString)

    this.scenar = null
  }

  /**
   * Чтение файла сценария как xml
   * @param {String} path путь к файлу сценария
   */
  async initialize(path) {
    if (this.scenar) return

    // промисификация
    const execProm = promisify(exec)
    const dir = path.slice(0, -4)

    // разархивирование
    await execProm(
      `"C:/Program Files/WinRAR/WinRAR.exe" x -o+ -ad "${path}" "${dirname(
        path
      )}"`
    )

    // чтение и (затем) удаление копии сценария
    const xml = await readFile(join(dir, 'data'), 'utf-8')
    await rm(dir, { recursive: true })

    this.scenar = await parcer.parseStringPromise(xml)
  }

  /**
   * Извлекает текст запроса из узла импорта
   * @param {Object} node узел импорта
   * @returns {string}
   */
  #getQuery(node) {
    const component = node.Component[0]

    // Колонки
    const columns = component.Columns[0]
    const fields = []
    const history = []
    Object.keys(columns).forEach((col) => {
      if (col === 'Count') return

      //
      const column = columns[col][0]

      // для лога истории имен и типов полей
      history.push(
        `${column.DisplayName[0]}  ${column.Name[0]}   ${column.DataType[0]}`
      )

      const { name, alias, dataType } = getFieldsData(
        column.DisplayName[0],
        column.DataType[0]
      )

      fields.push(`${name} КАК ${alias}`)

      //
      column.InternalName = [...column.Name]
      column.Name = [alias]
      column.DataType[0] = dataType
    })

    // Источник
    const sourceArr = component.RootAttributeName[0].split('.')
    const source = `${this.meta[sourceArr[1]]}.${sourceArr[2].replace(
      '#',
      '.'
    )}`

    // Фильтр
    let filter = component.Filter[0].QyeryText?.[0]
    if (filter) {
      filter = filter.replace(/\[|\]/g, '')
      filter = `ГДЕ ${filter.replace(/содержит/g, 'ПОДОБНО')}`
    }

    // Параметры
    let params = ''
    if (component.Params) {
      params = this.#getVirtParams(component.Params)
    }

    // Лог
    logger.logInFile(
      'info',
      `${node.DisplayName[0]}\n\n${history.join('\n')}`,
      './files/out/history.log'
    )

    // Результат
    return `ВЫБРАТЬ \n ${fields.join(',\n')} \n ИЗ ${source}${params} \n ${
      filter ?? ''
    }`
  }

  #getVirtParams(paramsObj) {
    const paramsArr = []
    Object.keys(paramsObj[0]).forEach((p) => {
      switch (p) {
        case 'AcRegTurnMaxDate':
        case 'AcRegBalTurnMaxDate': {
          const max = paramsObj[0][p]
          paramsArr.splice(1, 0, dateTime1C(max))
          break
        }
        case 'AcRegTurnMinDate':
        case 'AcRegBalTurnMinDate': {
          const min = paramsObj[0][p]
          paramsArr.splice(0, 0, dateTime1C(min))
          break
        }
        case 'AcRegTurnPeriodicity':
        case 'AcRegBalTurnPeriodicity': {
          const periodicity = this.meta[paramsObj[0][p]] ?? ''
          paramsArr.splice(3, 0, periodicity)
          break
        }
        // no default
      }
    })
    return paramsArr.length > 0 ? `(${paramsArr.join(',')})` : ''
  }

  /**
   * Конвертация узлов импорта сценария
   * @returns {Boolean} - Истина, если есть сконвертированные узлы
   */
  convertXml() {
    let nodesCount = 0

    const root = this.scenar.Document.Script[0].Root[0].SubNodes[0]
    let node
    Object.keys(root).forEach((imp) => {
      if (imp === 'Count') return

      node = root[imp][0]
      if (!node.DisplayName[0].startsWith('ut_')) return
      if (node.VendorName[0] === 'TBG1Cv8QueryImportVendor') return

      // Подменим узел импорта из 1С в компоненте
      const queryText = this.#getQuery(node)
      node.QueryText = [queryText]
      node.VendorName[0] = 'TBG1Cv8QueryImportVendor'

      // Вывод в консоль
      // console.group(root[imp][0].DisplayName[0])
      // console.log(queryText + '\n')
      // console.groupEnd()
      nodesCount += 1
    })

    logger.info(`Сконвертировано узлов: ${nodesCount}`)
    return nodesCount > 0
  }

  // Запись xml
  async writeXml(path) {
    const xml = builder.buildObject(this.scenar)
    writeFile(path, xml)
  }

  /**
   * Получение запроса 1С из узла импорта
   * @param {String} node имя узла импорта сценрария
   * @returns {String} текст запроса 1С
   */
  getQueryTextByNode(node) {
    const root = this.scenar.Document.Script[0].Root[0].SubNodes[0]
    const nodes = Object.values(root)

    /* eslint-disable-next-line */
    for (const n of nodes) {
      if (n[0].Name?.[0] === node) {
        return this.#getQuery(n[0])
      }
    }

    throw new Error(`Текст запроса не сформирован!!!! Узел: ${node}`)
  }

  /**
   * Получение параметров из сценария
   */
  formQueryParams() {
    const params = []
    const vars = this.scenar.Document.EnvironmentVariables[0].Vars[0]

    Object.keys(vars).forEach((envVar) => {
      if (envVar === 'Count') return

      let param = {}
      param.Имя = vars[envVar][0].Name[0]

      if (!param.Имя.startsWith('_')) return

      const type = vars[envVar][0].DataType?.[0]
      param.Тип = this.meta?.[type] ?? 'Строка'

      const value = vars[envVar][0].Value?.[0] ?? ''
      param.Значение = value

      if (param.Тип === 'Дата') {
        param.Значение = dateTime1C(value, 'ISO')
        param.deductor = value
      }

      params.push(param)
    })

    return params
  }
}

export default Deductor
