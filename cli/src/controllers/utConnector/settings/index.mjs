// system
import { readFileSync } from 'fs'

// logger
import logger from '../../logger/index.mjs'

// utils
import colors from 'ansi-colors'

// rc
import rc from 'rc'

/**
 * base settings from config
 * @param {string} base name in config
 * @param {string} config relative path
 * @returns {Object} auth and url data
 */
const getApp = (base, config) => {
  const settings = rc('cli', JSON.parse(readFileSync(config, 'utf-8')))
  const baseData = settings.bases[base]

  if (!baseData) throw new Error(`Отсутствует настройка базы: ${base}`)

  function* generateUrl() {
    for (const url of baseData.url) {
      yield url
    }
  }
  const urlGenerator = generateUrl()

  const app = {
    auth: baseData.auth,
    url: urlGenerator.next().value,
    switchUrl(msg) {
      const nextUrl = urlGenerator.next().value
      if (nextUrl) {
        this.url = nextUrl
        logger.error(`\n${msg}`)
        logger.info(`${colors.bold.green('\n Переход на ') + nextUrl}`)
      }
    },
  }

  return app
}

export { getApp }
