// **********node js**********
import { existsSync, readFileSync } from 'node:fs'

// **********wsClients**********
import { wsSendMessage } from './ws.js'

// **********utConnector**********
import Connector from 'connector'

// **********types**********
import { Request, Response } from 'express'
import { ConnInterface } from './types/index.js'

const connHandler = (req: Request<{}, {}, ConnInterface>, res: Response) => {
  let { base, query, params = [], output, config, user } = req.body

  if (existsSync(query)) {
    query = readFileSync(query, 'utf-8')
  }

  const conn = new Connector({ base, output, config })
  conn
    .getDataToCsv(query, params)
    .then(() => {
      res.send('query is ok')
      wsSendMessage('query is ok', user)
    })
    .catch((err) => {
      res.status(400)
      res.end(err.message)
    })
}

export { connHandler }
