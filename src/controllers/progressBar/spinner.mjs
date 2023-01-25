import _Terminal from '../../../node_modules/cli-progress/lib/terminal.js'

const frames = {
  frame1: [
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
  ],
  frame2: ['-', '\\', '|', '/'],
}

class Spinner {
  constructor(options, { frame, message, showTimer = false }) {
    // store options
    this.options = options

    // store terminal instance
    this.terminal = this.options.terminal
      ? this.options.terminal
      : new _Terminal(this.options.stream)

    // last drawn string - only render on change!
    this.lastDrawnString = null

    // set flag
    this.isActive = true

    // spinner message
    this.message = message

    // frame
    this.frame = frames[frame ?? 'frame1']
    this.index = 0

    // timer
    this.start = process.hrtime()
    this.showTimer = showTimer
  }

  render(forceRendering = false) {
    // timer
    let timer = ''
    if (this.showTimer) {
      const end = process.hrtime(this.start)
      const m = Math.trunc(end[0] / 60)
      const s = end[0] % 60
      timer = `${m}m ${s}s `
    }

    // frame
    const frame = this.frame[this.index++ % this.frame.length]
    const s = `${timer} ${this.message} ${frame}`

    const forceRedraw = forceRendering || this.options.forceRedraw

    // string changed ? only trigger redraw on change!
    if (forceRedraw || this.lastDrawnString !== s) {
      // set cursor to start of line
      this.terminal.cursorTo(0, null)

      // write output
      this.terminal.write(s)

      // clear to the right from cursor
      this.terminal.clearRight()

      // store string
      this.lastDrawnString = s
    }
  }

  stop() {
    this.isActive = false
  }
}

export default Spinner
