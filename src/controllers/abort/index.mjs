class MyAbortConroller extends AbortController {
  start(min) {
    this.timeout = setTimeout(() => {
      this.abort()
    }, min * 60000)
  }

  stop() {
    clearTimeout(this.timeout)
  }
}

const controller = new MyAbortConroller()

export default controller
