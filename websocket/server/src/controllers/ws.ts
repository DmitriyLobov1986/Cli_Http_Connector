import { WebsocketRequestHandler } from 'express-ws'

// **********types**********
import { Request, Response } from 'express'
import { IUsers } from './types/index.js'
import ws from 'ws'

// **********websocket clients**********
let wsClients: IUsers[] = []

const wsHandler: WebsocketRequestHandler = (ws: ws, req: Request): void => {
  if (typeof req.query.user === 'string') {
    wsClients.push({
      user: req.query.user,
      ws,
    })
  }

  ws.on('close', wsDelClient)
  ws.on('error', wsDelClient)
}

// **********handlers**********
function wsDelClient(this: ws): void {
  wsClients = wsClients.filter((wsClient) => wsClient.ws !== this)
}

function wsSendMessage(ms: string, user: string): void {
  wsClients.forEach((client: IUsers) => {
    if (client.user === user) client.ws.send(JSON.stringify({ ms, user }))
  })
}

function getActiveUsers(req: Request, res: Response) {
  res.set('Content-Type', 'text/html')

  let table = '<table border="1" width="100" bgcolor="yellow">\n'

  wsClients.forEach((client) => {
    table += `<tr>
                <td style="text-allign: center;font-weight: bold">
                   ${client.user}
                </td>
             </tr>`
  })

  table += `\n</table>`
  res.end(table)
}

export { wsHandler, wsSendMessage, getActiveUsers }
