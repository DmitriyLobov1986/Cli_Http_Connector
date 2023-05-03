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

ty
export interface IMessage {
  type: 'start' | 'loading' | 'finish'
  payload?: string | number
}
