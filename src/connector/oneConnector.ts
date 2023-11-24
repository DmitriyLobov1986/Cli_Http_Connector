import { InputVariables } from 'builtIn/Data'
import { fetch, Headers, Response } from 'builtIn/Fetch'
import { existsSync, statSync } from 'builtIn/FS'
import { getOneStype } from '../types/types_match.js'
import Logger from '../logger/index.js'
import { IOneConnector } from '../types/loginom.js'
import { IOneParams, IOneCheckParams, IOneResponse, IQueryParams } from '../types/one.js'

//invoke repeatable function
const sleep = (cb: () => boolean, ms: number) => {
  return new Promise((resolve) => {
    const run = () => {
      if (cb()) setTimeout(resolve, ms)
      else setTimeout(run, ms)
    }
    run()
  })
}

class OneConnector implements IOneConnector {
  path = ''
  pathOut = ''
  query = ''
  url = { path: '', auth: '', reuse: false }
  logger: Logger | undefined = undefined
  loadingID: string | null = null

  init({ url, path, pathOut, query, logger }: IOneConnector) {
    this.path = path
    this.pathOut = pathOut
    this.query = query
    this.url = url
    this.logger = logger
  }

  trigger1C() {
    const params = this.getUserVars()

    //log
    const logArr = [
      `query:\n${params.ТекстЗапроса}\n`,
      `vars:\n${JSON.stringify(params.ПараметрыЗапроса)}\n`,
    ]
    this.logger?.logArr(logArr)

    return this.#fetch1C(params)
      .then((response) => this.#responseHandle(response))
      .catch((err: Error) => {
        if (err.message.includes('Connection timed out')) {
          return this.#fetchDataFile()
        } else throw err
      })
  }

  //Private method - запрос к 1С
  #fetch1C(params: IOneParams | IOneCheckParams) {
    let headers = new Headers()
    headers.append('Content-Type', 'application/json')
    headers.append('Authorization', this.url.auth)

    const options = {
      method: 'post',
      body: JSON.stringify(params),
      headers,
    }

    return fetch(this.url.path, options)
  }

  //Private method - ожидание файла данных
  #fetchDataFile() {
    this.logger?.log('Переключение на ожидание файла!!!!!')

    const statInfo = {
      start: Date.now(),
      size: 0,
      sizeCheck: 0,
    }

    const check = () => {
      const pending = Date.now() - statInfo.start
      const timeout = 5 * 60 * 1000

      if (existsSync(this.pathOut)) {
        const stat = statSync(this.pathOut)
        statInfo.sizeCheck =
          stat.size > statInfo.size ? statInfo.sizeCheck : (statInfo.sizeCheck += 1)
        statInfo.size = stat.size
      }

      return statInfo.sizeCheck >= 5 || pending >= timeout
    }

    return sleep(check, 3000)
  }

  //Private method - обработка ответа 1С
  async #responseHandle<T extends IOneResponse>(response: Response): Promise<any> {
    if (!response.ok) {
      // throw response.statusText
      throw new Error(await response.text())
    }

    const answer = (await response.json()) as T
    //logger
    if (this.logger) {
      this.logger.logArr(answer.Сообщения || [])
    }

    switch (answer.Статус) {
      case 'Выполнено':
        return 'Выполнено'

      case 'Выполняется':
        this.loadingID = answer.ИдентификаторЗадания || this.loadingID
        const params = { ИдентификаторЗадания: this.loadingID }

        return sleep(() => true, 3000)
          .then(() => this.#fetch1C(params))
          .then((res) => this.#responseHandle(res))

      default:
        throw new Error(answer.КраткоеПредставлениеОшибки)
    }
  }

  //Получим переменные запроса
  getUserVars() {
    const queryData: IOneParams = {
      ТекстЗапроса: this.query.replace(/\//g, ''),
      ПутьКФайлу: this.path,
      ПараметрыЗапроса: [],
    }

    //search paras in query
    const queryParamsArr = this.query.match(/&\w+/g)

    //no params
    if (!queryParamsArr) return queryData

    //params data
    const inputVariablesArr = Array.from(InputVariables.Items)

    const acc: IQueryParams[] = []
    queryData.ПараметрыЗапроса = inputVariablesArr
      .filter((elm) => queryParamsArr.some((p) => elm.DisplayName === p.slice(1)))
      .reduce((acc, curV) => {
        acc.push({
          Имя: curV.DisplayName,
          Тип: getOneStype(curV.DataType),
          Значение: curV.Value,
        })
        return acc
      }, acc)

    return queryData
  }
}

export default OneConnector
