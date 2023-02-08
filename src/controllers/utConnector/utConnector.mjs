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

// settings
const settings = JSON.parse(readFileSync('./config.json', 'utf-8'))

// fetch
// eslint-disable-next-line no-unused-vars
import fetch, { AbortError, Headers, Response } from 'node-fetch'

// transform
import { AsyncParser } from '@json2csv/node'
import bigJson from 'big-json'

// utils
import encoding from 'encoding'
import progressBar from '../progressBar/index.mjs'
import { filtChunk, customTransform } from '../utils.mjs'
import colors from 'ansi-colors'

// timeout
import timeout from '../abort/index.mjs'

class UtConnector {
  /** @param {import('./utConnector').Options} options параметры */
  constructor({ base, output }) {
    this.multibar = progressBar
    this.bar = null

    const login = 'Deductor'
    const password = 'Kj,jdLV1880'

    this.url = settings.bases[base]

    // eslint-disable-next-line operator-linebreak
    this.auth =
      'Basic ' + Buffer.from(login + ':' + password).toString('base64')

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
      },
      {}
    )

    const transform = new TransformStream({
      objectMode: true,
      transform(chunk, enc, done) {
        const dataConvert = encoding.convert(
          customTransform(chunk.toString(), '\t'),
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
    const [resolve, reject, params, tm] = args

    const response = await fetch(this.url, params).catch((err) => {
      reject(err)
    })

    if (!response) return
    if (!response.ok) {
      switch (response.status) {
        case 406: {
          const self = this
          if (tm) clearTimeout(tm)
          const timer = setTimeout(() => {
            self.#fetch(resolve, reject, params, timer)
          }, 4000)
          break
        }
        default: {
          const errorMessage = await response.text()
          reject(
            new Error(
              `HTTP Error Response: ${errorMessage} \n ${response.status} ${response.statusText}`
            )
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
   * @param {import('./utConnector').qParams} qParams параметры запроса
   * @param {string} [loop] путь к файлу параметров
   */
  async getDataToCsv(query, qParams, loop) {
    let filtArr = ['']
    if (loop) {
      filtArr = await filtChunk(loop)
    }

    // spinner
    this.multibar.createSpinner({
      message: `${colors.bold.blue('Выполнение запроса')}`,
      frame: 'frame2',
      showTimer: true,
    })
    timeout.start(10)
    // this.emit('loading')

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
        }),
        signal: timeout.create(),
      }

      fetchArr.push(
        // eslint-disable-next-line no-loop-func
        (async () => {
          const response = await new Promise((resolve, reject) => {
            this.#fetch(resolve, reject, params)
          })

          await this.#writeResp(response, f.toString().replace(/\r|\n/g, ''))
        })()
      )
    }

    try {
      await Promise.all(fetchArr)
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
