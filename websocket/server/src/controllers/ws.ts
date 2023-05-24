// **********sysmem**********
import { randomUUID } from 'node:crypto'

// **********express**********
import { WebsocketRequestHandler } from 'express-ws'

// **********types**********
import { Request, Response } from 'express'
import { IUsers, IMessage, IMessageIN } from './types/index.js'
import ws from 'ws'

// **********websocket clients**********
let wsClients: IUsers[] = []

const wsHandler: WebsocketRequestHandler = (ws: ws, req: Request): void => {
  if (typeof req.query.user === 'string') {
    wsClients.push({
      user: req.query.user,
      ws,
      loadings: [],
    })
  }

  ws.on('close', wsDelClient)
  ws.on('error', wsDelClient)
  ws.on('message', wsStopLoading)
}

// **********handlers**********
function wsDelClient(this: ws): void {
  wsClients = wsClients.filter((wsClient) => wsClient.ws !== this)
}

function wsSendMessage(ms: IMessage, user: string): void {
  wsClients.forEach((client: IUsers) => {
    if (client.user === user) {
      client.ws.send(JSON.stringify(ms))
      client.loadings = client.loadings.filter(
        (loading) => loading.id !== ms.id || ms.data.type !== 'finish'
      )
    }
  })
}

function wsAddLoading(user: string, name: string, timeout: any): string {
  let id = ''
  wsClients
    .filter((client) => client.user === user)
    .forEach((client) => {
      id = randomUUID({ disableEntropyCache: true })
      client.loadings.push({ id, name, timeout })
    })
  return id
}

function wsStopLoading(ms: string) {
  const msData: IMessageIN = JSON.parse(ms)
  wsClients
    .filter((client) => client.user === msData.user)
    .forEach((client) => {
      for (const loading of client.loadings) {
        if (loading.id === msData.id) loading.timeout.abort()
      }
    })
}

function getActiveUsers(req: Request, res: Response) {
  res.render('users', { clients: wsClients })
}

export { wsHandler, wsSendMessage, getActiveUsers, wsAddLoading }
