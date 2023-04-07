import ws from 'ws'

export interface IConnInterface {
  base: string
  query: string
  output: string
  user: string
  params?: Array
  config?: string
}

export interface IUsers {
  user: string
  ws: ws
}

export interface IQueryParams {
  user: string
}
