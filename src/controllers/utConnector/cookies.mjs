// system
import { writeFile } from 'fs/promises'

import { CookieJar } from 'node-fetch-cookies'
import argv from '../yargs/index.mjs'

class MyCookieJas extends CookieJar {
  /** @param {string} output output file path  */
  constructor(output) {
    super()
    this.output = output.replace('.csv', '_cookies.json')
  }

  loadCookies() {
    return argv.session
      ? this.load(this.output).catch(() => {})
      : Promise.resolve()
  }

  saveCookies() {
    return argv.session
      ? writeFile(this.output, JSON.stringify([...this.cookiesValid(true)]))
      : Promise.resolve()
  }
}

export default MyCookieJas
