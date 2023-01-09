import cliProgress from 'cli-progress'
import logUpdate from 'log-update'
import colors from 'ansi-colors'

class MyProgress extends cliProgress.SingleBar {
  constructor(opt, preset) {
    super(opt, preset)
    this.logUpdate = logUpdate
  }

  spinner() {
    let spinner
    const start = (message) => {
      const frames = [
        '.',
        '..',
        '...',
        '....',
        '.....',
        '......',
        '.......',
        '........',
        '.........',
        '..........',
      ]
      let index = 0

      spinner = setInterval(() => {
        const frame = frames[index++ % frames.length]
        this.logUpdate(`${message} ${frame}`)
      }, 200)
    }

    const stop = () => {
      clearInterval(spinner)
      this.logUpdate.clear()
    }

    return { stop, start }
  }
}

const progressBar = new MyProgress(
  {
    stopOnComplete: true,
    clearOnComplete: true,
    format: `${colors.cyan(
      '{message}'
    )} [{bar}] {percentage}% | DUR: {duration}s | ${colors.green(
      '{value}/{total}'
    )}`,
  },
  cliProgress.Presets.shades_grey
)

export default progressBar
