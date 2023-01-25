// #region eslint

/* eslint-disable no-useless-catch */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

// #endregion

// system
import { readFile } from 'node:fs/promises'
import { createWriteStream } from 'fs'
import { Transform as TransformStream } from 'stream'
import { pipeline } from 'node:stream/promises'

// fetch
// eslint-disable-next-line no-unused-vars
import fetch, { Headers, Response } from 'node-fetch'

// transform
import { AsyncParser } from '@json2csv/node'
import bigJson from 'big-json'

// utils
import encoding from 'encoding'
import progressBar from '../progressBar/index.mjs'
import { customTransform } from '../utils.mjs'
import colors from 'ansi-colors'
import lodash from 'lodash'

// timeout
import timeout from '../abort/index.mjs'

class UtConnector extends TransformStream {
  constructor(options, output) {
    super(options)

    this.multibar = progressBar
    this.bar = null

    const login = 'Deductor'
    const password = 'Kj,jdLV1880'

    this.url = 'http://10.10.235.26/ut11-roz-olap/hs/reports/report'
    // this.url = 'http://ut11-roz.pochtavip.com//ut11-roz/hs/reports/report'

    // eslint-disable-next-line operator-linebreak
    this.auth =
      'Basic ' + Buffer.from(login + ':' + password).toString('base64')

    this.output = output
  }

  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk, enc, done) {
    const dataConvert = encoding.convert(
      customTransform(chunk.toString(), '\t'),
      'windows-1251',
      'utf-8'
    )
    this.bar.increment()
    done(null, dataConvert)
  }

  /**
   * Парсим данные ответа в csv файл
   * @param {Response} response
   * @returns {Promise<Array>}
   */
  async #readResp(response) {
    const parseStreamToJson = bigJson.createParseStream()

    //--------------------------------------------------------------
    // Чтение данных
    //--------------------------------------------------------------

    let data = []

    const responseSize = +response.headers.get('Content-Length')

    // progress-bar
    const bar = this.multibar.create(responseSize, 0, {
      message: 'Чтение данных',
    })

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

    return data
  }

  /**
   *
   * @param {Array} responseData
   */
  async #writeCsv(responseData) {
    const writeStream = createWriteStream(this.output, { flags: 'a' })
    const parseStreamToCsv = new AsyncParser(
      {
        delimiter: '\t',
        doubleQuote: 'quote',
      },
      {}
    )
    //--------------------------------------------------------------
    // Запись данных
    //--------------------------------------------------------------

    // progress-bar
    this.bar = this.multibar.create(responseData.length, 0, {
      message: 'Запись данных',
    })
    await pipeline(parseStreamToCsv.parse(responseData), this, writeStream)
  }

  /**
   *
   * @param {string} query текст запроса
   * @param {import('./utConnector').qParams} qParams параметры запроса
   * @param {string} loop параметры множественного запроса
   */
  async getDataToCsv(query, qParams, loop) {
    let queryArr = [query]
    if (loop) {
      const loopData = await readFile(loop, 'utf-8')
      const loopArr = loopData.split('\n')
      queryArr = lodash.chunk(loopArr, 2).map((group) => {
        return query.replace('&loop', group.join(','))
      })
    }

    // Загоняем параметры в цикл
    let params = []
    for (const q of queryArr) {
      const body = {
        ТекстЗапроса: q,
        ПараметрыЗапроса: qParams,
      }
      params.push({
        method: 'post',
        body: JSON.stringify(body),
        headers: new Headers({
          Authorization: this.auth,
        }),
        signal: timeout.signal,
      })
    }

    // Запрос

    // spinner
    this.multibar.createSpinner({
      message: `${colors.bold.blue('Выполнение запроса')}`,
      frame: 'frame2',
      showTimer: true,
    })
    timeout.start(10)
    this.emit('loading')

    const fetchArr = []
    let dataArr = []
    for (const param of params) {
      fetchArr.push(
        // eslint-disable-next-line no-loop-func
        (async () => {
          const response = await fetch(this.url, param)
          if (!response.ok) {
            const errorMessage = await response.text()
            throw new Error(
              `HTTP Error Response: ${errorMessage} \n ${response.status} ${response.statusText}`
            )
          } else {
            const data = await this.#readResp(response)
            dataArr = [...data, ...dataArr]
          }
        })()
      )
    }

    try {
      await Promise.all(fetchArr)
      await this.#writeCsv(dataArr)
    } catch (error) {
      timeout.abort()
      throw error
    } finally {
      this.multibar.stop()
      timeout.stop()
    }
  }
}

export default UtConnector
