import { WebsocketRequestHandler } from 'express-ws'
import ws from 'ws'

// **********websocket clients**********
let wsClients: ws[] = []

// **********delete wsClient**********
function delWsClient(this: ws) {
  wsClients = wsClients.filter((wsClient) => wsClient !== this)
}

const wsHandler: WebsocketRequestHandler = (ws) => {
  wsClients.push(ws)
  // **********handlers**********
  ws.on('close', delWsClient)
  ws.on('error', delWsClient)
}

export { wsHandler, wsClients }
