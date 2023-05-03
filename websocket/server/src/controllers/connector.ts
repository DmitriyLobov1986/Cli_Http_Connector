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

const connHandler = (req: Request<{}, {}, IConnInterface>, res: Response, next: any) => {
  let user = ''

  ;(async function () {
    let { base, query, params = [], output, config } = req.body
    user = req.body.user

    // delete old file
    if (existsSync(output)) {
      await unlink(output)
    }

    if (existsSync(query)) {
      query = readFileSync(query, 'utf-8')
    }

    const conn = new Connector({ base, output, config })

    conn.multibar.on('progress', (data: number | string) => {
      wsSendMessage({ type: 'loading', payload: data }, user)
    })

    wsSendMessage({ type: 'start' }, user)

    await conn.getDataToCsv(query, params).then(() => {
      res.send('query is ok')
    })
  })()
    .catch(next)
    .finally(() => {
      wsSendMessage({ type: 'finish' }, user)
    })
}

export { connHandler }
