// **********node js**********
import { existsSync, readFileSync } from 'node:fs'
import { unlink } from 'node:fs/promises'

// **********wsClients**********
import { wsSendMessage } from './ws.js'

// **********utConnector**********
import Connector from 'connector'

// **********types**********
import { Request, Response } from 'express'
import { IConnInterface } from './types/index.js'

const connHandler = async (req: Request<{}, {}, IConnInterface>, res: Response) => {
  let { base, query, params = [], output, config, user } = req.body

  // delete old file
  if (existsSync(output)) {
    await unlink(output)
  }

  if (existsSync(query)) {
    query = readFileSync(query, 'utf-8')
  }

  const conn = new Connector({ base, output, config })

  conn.multibar.on('progress', (data: number | string) => {
    wsSendMessage(String(data), user)
  })

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
