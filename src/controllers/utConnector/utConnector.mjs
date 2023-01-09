/* eslint-disable no-console */
// system
import { createWriteStream } from 'fs'
import { Transform as TransformStream } from 'stream'
import { pipeline } from 'stream/promises'

// fetch
import fetch, { Headers } from 'node-fetch'

// transform
import { AsyncParser } from '@json2csv/node'
import bigJson from 'big-json'

// utils
import encoding from 'encoding'
import progressBar from '../progressBar/index.mjs'
import { customTransform } from '../utils.mjs'
import colors from 'ansi-colors'

// logger
import logger from '../logger/index.mjs'

// timeout
import timeout from '../abort/index.mjs'

class UtConnector extends TransformStream {
  constructor(options, output) {
    super(options)

    this.progressBar = progressBar
    this.spinner = this.progressBar.spinner()

    const login = 'Deductor'
    const password = 'Kj,jdLV1880'

    // this.url = 'http://10.10.235.26/ut11-roz-olap/hs/reports/report'
    this.url = 'http://ut11-roz.pochtavip.com//ut11-roz/hs/reports/report'

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
    this.progressBar.increment()
    done(null, dataConvert)
  }

  /**
   * Парсим данные ответа в csv файл
   * @param response
   */
  async #parseToCsv(response) {
    const writeStream = createWriteStream(this.output)
    const parseStreamToJson = bigJson.createParseStream()
    const parseStreamToCsv = new AsyncParser(
      {
        delimiter: '\t',
        doubleQuote: 'quote',
      },
      {}
    )

    let responseData = []
    const responseSize = +response.headers.get('Content-Length')
    try {
      if (responseSize >= 500000000) {
        //--------------------------------------------------------------
        // Чтение данных
        //--------------------------------------------------------------
        this.progressBar.start(responseSize, 0, {
          message: 'Чтение данных',
        })

        response.body.on('data', (chunk) => {
          this.progressBar.increment(chunk.length)
        })

        parseStreamToJson.on('data', (pojo) => {
          responseData = pojo
        })

        await pipeline(response.body, parseStreamToJson)
      } else {
        // @ts-ignore
        responseData = await response.json()
      }

      //--------------------------------------------------------------
      // Запись данных
      //--------------------------------------------------------------
      this.progressBar.start(responseData.length, 0, {
        message: 'Запись данных',
      })

      await pipeline(parseStreamToCsv.parse(responseData), this, writeStream)
    } catch (error) {
      this.progressBar.stop()
      throw error
    }
  }

  /**
   *
   * @param {String} query текст запроса
   * @param {import('./utConnector').qParams} qParams параметры запроса
   */
  async getDataToCsv(query, qParams) {
    let response

    const body = {
      ТекстЗапроса: query,
      ПараметрыЗапроса: qParams,
    }
    const params = {
      method: 'post',
      body: JSON.stringify(body),
      headers: new Headers({
        Authorization: this.auth,
      }),
      signal: timeout.signal,
    }

    // Запрос
    this.spinner.start(`${colors.bold.blue('Выполнение запроса')}`)
    timeout.start(10)
    this.emit('loading')

    try {
      console.time('fetch')
      response = await fetch(this.url, params)
      // eslint-disable-next-line no-useless-catch
    } catch (err) {
      throw err
    } finally {
      this.spinner.stop()
      timeout.stop()
      console.timeEnd('fetch')
    }

    //-------------------------------------------------------
    // Чтение ответа
    if (response.ok) {
      logger.info('Данные получены!!!\n')
      await this.#parseToCsv(response)
    } else {
      const errorMessage = await response.text()
      throw new Error(
        `HTTP Error Response: ${errorMessage} \n ${response.status} ${response.statusText}`
      )
    }
  }
}

export default UtConnector
