import Logger from '../logger/index'

interface IUrl {
  path: string
  auth: string
  reuse: boolean
}

export interface IOneConnector {
  url: IUrl
  path: string
  pathOut: string
  query: string
  loadingID: string | null
  logger?: Logger
}
