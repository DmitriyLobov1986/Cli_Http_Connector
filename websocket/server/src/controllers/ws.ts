import { WebsocketRequestHandler } from 'express-ws'
import ws from 'ws'

// **********websocket clients**********
let wsClients: ws[] = []
const wsHandler: WebsocketRequestHandler = (ws): void => {
  wsClients.push(ws)

  ws.on('close', wsDelClient)
  ws.on('error', wsDelClient)
}

// **********handlers**********
function wsDelClient(this: ws): void {
  wsClients = wsClients.filter((wsClient) => wsClient !== this)
}

function wsSendMessage(ms: string, user: string): void {
  wsClients.forEach((ws) => {
    ws.send(JSON.stringify({ ms, user }))
  })
}

export { wsHandler, wsSendMessage }
