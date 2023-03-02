interface Yargs {
  [x: string]: unknown
  _: (string | number)[]
  $0: string
}

export interface Argv extends Yargs {
  path?: string
  name?: string
  query?: string
  params?: string | boolean
  loop?: number
  base?: string
  session?: boolean
}
