// #region eslint

/* eslint-disable no-useless-catch */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

// #endregion

// system
import { createWriteStream, readFileSync } from 'fs'
import { Transform as TransformStream } from 'stream'
import { pipeline } from 'node:stream/promises'

// fetch
// eslint-disable-next-line no-unused-vars
import { fetch, Headers, Response } from 'node-fetch-cookies'
import CookiJar from './cookies.mjs'

// transform
import { AsyncParser } from '@json2csv/node'
import { stringQuoteOnlyIfNecessary as stringQuoteOnlyIfNecessaryFormatter } from '@json2csv/formatters'
import bigJson from 'big-json'

// utils
import encoding from 'encoding'
import progressBar from '../progressBar/index.mjs'
import * as utils from './helpers.mjs'
import colors from 'ansi-colors'

// timeout
import timeout from '../abort/index.mjs'

class UtConnector {
  /** @param {import('./types').Options} options параметры */
  constructor({ base, output, config = './config.json' }) {
    this.multibar = progressBar()
    this.bar = null

    // settings
    const settings = JSON.parse(readFileSync(config, 'utf-8'))
    const login = 'Deductor'
    const password = 'Kj,jdLV1880'
    this.url = settings.bases[base]

    // eslint-disable-next-line operator-linebreak
    this.auth =
      'Basic ' + Buffer.from(login + ':' + password).toString('base64')

    this.output = output
  }

  /**
   * Пишем заголовок
   * @param {Array<string>} fields поля запроса
   */
  #writeHeader(fields) {
    const writeStream = createWriteStream(this.output, { flags: 'a' })

    const header = encoding.convert(fields.join('\t'), 'windows-1251')

    writeStream.write(header)
    writeStream.end()
  }

  /**
   * Парсим данные ответа в csv файл
   * @param {Response} response fetch response
   * @param {Array<string>} fields query fields
   * @param {String} barMessage
   */
  async #writeResp(response, fields, barMessage) {
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
        header: false,
        fields,
        transforms: [utils.customTransform],
        formatters: {
          string: stringQuoteOnlyIfNecessaryFormatter({ quote: '' }),
        },
      },
      {}
    )

    const transform = new TransformStream({
      transform(chunk, enc, done) {
        const dataConvert = encoding.convert(
          '\r\n' + chunk.toString().replace(/[\r\n]/g, ''),
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
    const [resolve, reject, params, cookieJar, tm] = args

    const response = await fetch(cookieJar, this.url, params).catch((err) => {
      reject(err)
    })

    const refresh = (self) => {
      if (tm) clearTimeout(tm)
      const timer = setTimeout(() => {
        self.#fetch(resolve, reject, params, cookieJar, timer)
      }, 4000)
    }

    if (!response) return
    if (!response.ok) {
      switch (response.status) {
        case 406: {
          refresh(this)
          break
        }
        default: {
          const errorMessage = await response.text()
          if (errorMessage.includes('Сеанс отсутствует')) {
            cookieJar.cookies.clear()
            refresh(this)
          } else {
            reject(
              new Error(
                `HTTP Error Response: ${errorMessage} \n ${response.status} ${response.statusText}`
              )
            )
          }
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
    const filtArr = utils.getQueryChunks(query)
    const fileds = utils.getQueryFields(query)

    // cookies
    const cookieJar = new CookiJar(this.output)
    await cookieJar.loadCookies()

    // spinner
    this.multibar.createSpinner({
      message: `${colors.bold.blue('Выполнение запроса')}`,
      frame: 'frame2',
      showTimer: true,
    })

    // bar
    let bar = null
    if (filtArr.length > 10) {
      bar = this.multibar.create(filtArr.length, 0, {
        message: 'Обработка пакета',
        details: 'запись данных!!!!',
      })
      this.multibar.multimode = false
    }

    timeout.start(10)

    // цикл по фильтрам
    const fetchArr = []

    for (const f of filtArr) {
      const body = {
        ТекстЗапроса: query.replace('&loop', f),
        ПараметрыЗапроса: qParams,
      }
      const params = {
        method: 'post',
        body: JSON.stringify(body),
        headers: new Headers({
          Authorization: this.auth,
          IBSession: 'start',
        }),
        signal: timeout.create(),
      }

      fetchArr.push(
        // eslint-disable-next-line no-loop-func
        (async () => {
          const response = await new Promise((resolve, reject) => {
            this.#fetch(resolve, reject, params, cookieJar)
          })

          await this.#writeResp(
            response,
            fileds,
            f.toString().replace(/\r|\n/g, '')
          )
          if (bar) bar.increment()
        })()
      )
    }

    try {
      this.#writeHeader(fileds)
      await Promise.all(fetchArr)
      await cookieJar.saveCookies()
    } catch (err) {
      timeout.abort()
      throw err
    } finally {
      this.multibar.stop()
      timeout.stop()
    }
  }
}

export default UtConnector
