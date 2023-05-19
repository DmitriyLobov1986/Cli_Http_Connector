class MyAbortConroller {
  constructor() {
    this.abortControllers = []
    this.timeout = null
  }

  create() {
    const ac = new AbortController()
    this.abortControllers.push(ac)
    return ac.signal
  }

  abort() {
    this.abortControllers.forEach((ac) => {
      ac.abort()
    })
  }

  start(min) {
    this.timeout = setTimeout(() => {
      this.abort()
    }, min * 60000)
  }

  stop() {
    clearTimeout(this.timeout)
  }
}

const setController = () => new MyAbortConroller()

export default setController
