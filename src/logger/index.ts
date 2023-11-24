import * as fs from 'builtIn/FS'

class Logger {
  path: string
  #fd: fs.FileHandle

  constructor(path: string) {
    this.path = path
    this.#fd = fs.openSync(path, 'w+')
  }

  log(msg: string) {
    // msg = msg.replace(/\n/, '')
    fs.writeFileSync(this.#fd, `${msg}\n`, { encoding: 'utf8' })
  }

  logArr(msgArr: string[]) {
    for (const msg of msgArr) {
      this.log(msg)
    }
  }

  close() {
    fs.closeSync(this.#fd)
  }
}

export default Logger
