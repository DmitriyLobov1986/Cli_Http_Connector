// #region imports
import { Presets, MultiBar } from 'cli-progress'
import Spinner from './spinner.mjs'
import colors from 'ansi-colors'
// #endregion

/**
 * JSDoc style
 * @typedef {object} spOptions
 * @property {string} frame
 * @property {string} message
 * @property {boolean} [showTimer]
 */

class MyProgress extends MultiBar {
  constructor(opt, preset) {
    super(opt, preset)
    this.bars = []

    // multi mode
    this.multimode = true

    //
    this.progress = 0
  }

  /**
   * @param {spOptions} spOptions
   */
  createSpinner(spOptions) {
    // create spinner
    const spinner = new Spinner(Object.assign({}, this.options), spOptions)

    // push spinner to multibar
    this.bars.push(spinner)
    this.isActive = true

    // hide the cursor ?
    if (this.options.hideCursor === true) {
      this.terminal.cursor(false)
    }

    this.update()

    return spinner
  }

  // @ts-ignore
  create(total, startValue, payload) {
    if (this.multimode) {
      return super.create(total, startValue, payload)
    }

    // mokka bar
    return {
      increment(size) {
        return size
      },
      update(chunk) {
        return chunk
      },
      start(totV, stV, pl) {
        return { totV, stV, pl }
      },
    }
  }

  update() {
    super.update()
    /** @type {Array<number>} */
    const progs = []
    this.bars
      .slice(1)
      .forEach((bar) => progs.push(Math.round((bar.value / bar.total) * 100)))

    const min = Math.min(...progs)
    if (min !== this.progress && Number.isFinite(min)) {
      this.emit('progress', min)
      this.progress = min
    }
  }
}

const progressBar = () => {
  return new MyProgress(
    {
      stopOnComplete: true,
      clearOnComplete: true,
      hideCursor: true,
      format: `${colors.cyan(
        '{message}'
      )} [{bar}] {percentage}% | DUR: {duration}s | ${colors.green(
        '{value}/{total}'
      )} | '{details}'`,
      fps: 5,
    },
    Presets.shades_grey
  )
}

export default progressBar
