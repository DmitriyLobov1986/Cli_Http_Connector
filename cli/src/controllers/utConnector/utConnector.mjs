// #region eslint

/* eslint-disable no-useless-catch */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

// #endregion

// system
import { createWriteStream } from 'fs'
import { Transform as TransformStream } from 'stream'
import { pipeline } from 'node:stream/promises'
import path from 'path'

// fetch
// eslint-disable-next-line no-unused-vars
import fetch, { Headers, Response } from 'node-fetch'

// transform
import { AsyncParser } from '@json2csv/node'
import { number as numberFormatter } from '@json2csv/formatters'
import bigJson from 'big-json'

// utils
import encoding from 'encoding'
import progressBar from '../progressBar/index.mjs'
import * as utils from './helpers.mjs'
import colors from 'ansi-colors'

// timeout
import setAbortTimeout from '../abort/index.mjs'

// logger
import logger from '../logger/index.mjs'

// app settings
import { getApp } from './settings/index.mjs'
class UtConnector {
  /** @param {import('./types').Options} options параметры */
  constructor({ base, output, config = './config.json' }) {
    this.multibar = progressBar()
    this.timeout = setAbortTimeout()
    this.bar = null
    this.header = null

    this.app = getApp(base, config)

    this.output = output
  }

  /**
   * Парсим данные ответа в csv файл
   * @param {Response} response fetch response
   * @param {String} barMessage
   */
  async #writeResp(response, barMessage) {
    const responseSize = +response.headers.get('Content-Length')

    // progress-bar
    const bar = this.multibar.create(responseSize, 0, {
      message: 'Чтение данных',
      details: barMessage,
    })

    // streams
    const parseStreamToJson = bigJson.createParseStream()
    const parseStreamToCsv = new AsyncParser(
      {
        delimiter: '\t',
        doubleQuote: 'quote',
        header: this.header,
        formatters: {
          string: utils.customStringFormatter,
          // string: stringQuoteOnlyIfNecessaryFormatter({ quote: '' }),
          number: numberFormatter({ separator: ',' }),
        },
      },
      {}
    )

    this.header = false

    const transform = new TransformStream({
      transform(chunk, enc, done) {
        const dataConvert = encoding.convert(
          chunk.toString().replace(/[\r\n]/g, '') + '\r\n',
          'windows-1251',
          'utf-8'
        )
        bar.increment()
        done(null, dataConvert)
      },
    })

    const writeStream = createWriteStream(this.output, { flags: 'a' })

    //--------------------------------------------------------------
    // Чтение данных
    //--------------------------------------------------------------

    let data = []

    if (responseSize >= 500000000) {
      response.body.on('data', (chunk) => {
        bar.increment(chunk.length)
      })

      parseStreamToJson.on('data', (pojo) => {
        data = pojo
      })

      await pipeline(response.body, parseStreamToJson)
    } else {
      data = /** @type {Array} */ (await response.json())
      bar.update(responseSize)
    }

    //--------------------------------------------------------------
    // Запись данных
    //--------------------------------------------------------------

    bar.start(data.length, 0, {
      message: 'Запись данных',
      details: barMessage,
    })
    await pipeline(parseStreamToCsv.parse(data), transform, writeStream)
  }

  async #fetch(...args) {
    const [resolve, reject, params] = args

    const url = this.app.url
    const response = await fetch(url, params).catch((err) => {
      reject(err)
    })

    const refresh = () => {
      setTimeout(this.#fetch.bind(this, resolve, reject, params), 5000)
    }

    if (!response) return
    if (!response.ok) {
      switch (response.status) {
        case 406: {
          refresh()
          break
        }

        default: {
          const errorMessage = await response.text()

          if (!errorMessage.includes('ТекстОшибки')) {
            this.app.switchUrl(errorMessage)
            if (url !== this.app.url) {
              refresh()
              return
            }
          }

          reject(
            new Error(
              `HTTP Error Response: ${errorMessage} \n ${response.status} ${response.statusText}`
            )
          )

          // logger
          const errorFile = path.join(path.dirname(this.output), 'error.log')
          const queryBody = JSON.parse(params.body)
          logger.logInFile(
            'error',
            `${queryBody.ТекстЗапроса}\n${JSON.stringify(
              queryBody.ПараметрыЗапроса
            )}\n\n${errorMessage}`,
            errorFile
          )
        }
      }
    } else {
      resolve(response)
    }
  }

  /**
   *
   * @param {string} query текст запроса
   * @param {import('./types').qParams} qParams параметры запроса
   */
  async getDataToCsv(query, qParams) {
    const filtArr = utils.getQueryChunks(query, qParams)

    // header
    this.header = true

    // spinner
    this.multibar.createSpinner({
      message: `${colors.bold.blue('Выполнение запроса')}`,
      frame: 'frame2',
      showTimer: true,
    })

    // bar
    let bar = null
    if (filtArr.size > 10) {
      bar = this.multibar.create(filtArr.size, 0, {
        message: 'Обработка пакета',
        details: 'запись данных!!!!',
      })
      this.multibar.multimode = false
    }

    this.timeout.start(10)

    // цикл по фильтрам
    const fetchArr = []

    for (const f of filtArr) {
      const body = {
        ТекстЗапроса: f[0],
        ПараметрыЗапроса: qParams,
      }
      const params = {
        method: 'post',
        body: JSON.stringify(body),
        headers: new Headers({
          Authorization: this.app.auth,
          IBSession: 'start',
        }),
        signal: this.timeout.create(),
      }

      fetchArr.push(
        // eslint-disable-next-line no-loop-func
        (async () => {
          const response = await new Promise((resolve, reject) => {
            this.#fetch(resolve, reject, params)
          })

          await this.#writeResp(response, f[1].toString())
          if (bar) bar.increment()
        })()
      )
    }

    try {
      await Promise.all(fetchArr)
    } catch (err) {
      this.timeout.abort()
      throw err
    } finally {
      this.multibar.stop()
      this.timeout.stop()
    }
  }
}

export default UtConnector
