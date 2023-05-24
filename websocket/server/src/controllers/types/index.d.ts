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
  loadings: Array<{
    id: string
    name: string
    timeout: { abort(): void }
  }>
}

export interface IMessage {
  id: string
  data: { type: 'start' | 'loading' | 'finish'; name?: string; payload?: string | number }
}

export interface IMessageIN {
  id: string
  user: string
}
