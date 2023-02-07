// #region imports
import { Presets } from 'cli-progress'
import MultiBar from '../../../node_modules/cli-progress/lib/multi-bar.js'
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

    super.update()

    return spinner
  }
}

const progressBar = new MyProgress(
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

export default progressBar
