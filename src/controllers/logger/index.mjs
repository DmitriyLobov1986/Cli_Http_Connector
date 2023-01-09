import winston from 'winston-callback'

const { createLogger, format, transports } = winston

class MyLogger {
  constructor() {
    const myFormat = format.printf(({ level, message, timestamp, stack }) => {
      return `\n ${timestamp} ${level}: \n${stack || message}\n`
    })

    const colorFormat = { info: 'underline blue' }

    const logger = createLogger({
      format: format.combine(
        format.errors({ stack: true }),
        format.colorize({
          colors: colorFormat,
        }),
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        myFormat
      ),
      transports: [new transports.Console({})],
    })
    this.logger = logger
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

    // if (callback) {
    //   watch(dirname(path), (event, filename) => {
    //     if (event === 'change' && filename === basename(path)) {
    //       callback()
    //     }
    //   })
    // }

    this.logger.add(fileTransport)
    this.logger.log(level, message)
    this.logger.remove(fileTransport)
  }

  info(message) {
    this.logger.info(message)
  }

  error(message) {
    this.logger.error(message)
  }
}

export default new MyLogger()
