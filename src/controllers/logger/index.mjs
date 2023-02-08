import winston from 'winston-callback'

const { createLogger, format, transports } = winston

function createLoggerInstance() {
  const myFormat = format.printf(({ level, message, timestamp, stack }) => {
    return `\n ${timestamp} ${level}: \n${stack || message}\n`
  })

  const colorFormat = { info: 'underline blue' }

  return createLogger({
    format: format.combine(
      format.errors({ stack: true }),
      format.colorize({
        colors: colorFormat,
      }),
      format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
      myFormat
    ),
  })
}

class MyLogger {
  constructor() {
    this.logger = createLoggerInstance()
  }

  /** @param {winston.transport} transport */
  #setTransport(transport = new transports.Console({})) {
    this.logger.clear()
    this.logger.add(transport)
  }

  /**
   * Дополнительно пишет сообщение в файл
   * @param {string} level уровень сообщения
   * @param {string | Error} message сообщение
   * @param {string} path путь лога
   */
  logInFile(level, message, path) {
    const fileTransport = new transports.File({
      filename: path,
      // options: { flags: 'w' },
    })

    this.#setTransport(fileTransport)
    this.logger.log(level, message)
  }

  log(level, message) {
    this.#setTransport()
    this.logger.log(level, message)
  }

  info(message) {
    this.#setTransport()
    this.logger.info(message)
  }

  error(message) {
    this.#setTransport()
    this.logger.error(message)
  }
}

export default new MyLogger()
