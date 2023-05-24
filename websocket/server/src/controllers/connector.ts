// **********node js**********
import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { unlink } from 'node:fs/promises'

// **********wsClients**********
import * as ws from './ws.js'

// **********utConnector**********
import Connector from 'connector'

// **********types**********
import { Request, Response } from 'express'
import { IConnInterface } from './types/index.js'

const connHandler = (req: Request<{}, {}, IConnInterface>, res: Response, next: any) => {
  let user = ''
  let id = ''

  ;(async function () {
    let { base, query, params = [], output, config } = req.body
    user = req.body.user

    const name = basename(output, '.csv')

    // delete old file
    if (existsSync(output)) {
      await unlink(output)
    }

    if (existsSync(query)) {
      query = readFileSync(query, 'utf-8')
    }

    const conn = new Connector({ base, output, config })

    id = ws.wsAddLoading(user, name, conn.timeout)

    ws.wsSendMessage({ id, data: { type: 'start', name } }, user)

    conn.multibar.on('progress', (data: number | string) => {
      ws.wsSendMessage({ id, data: { type: 'loading', payload: data } }, user)
    })

    await conn.getDataToCsv(query, params).then(() => {
      res.send('query is ok')
    })
  })()
    .catch(next)
    .finally(() => {
      ws.wsSendMessage({ id, data: { type: 'finish' } }, user)
    })
}

export { connHandler }
