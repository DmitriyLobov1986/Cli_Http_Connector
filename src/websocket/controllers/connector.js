// **********wsClients**********
import { wsClients } from './ws.js'

// **********utConnector**********
import UtConnector from '../../controllers/utConnector/utConnector.mjs'

const connHandler = (req, res) => {
  const { query, params = [], output = './test.csv', user = '' } = req.body
  const conn = new UtConnector({}, output)

  // **********websoket**********
  conn.on('loading', () => {
    wsClients.forEach((ws) => {
      const msg = {
        user,
        text: 'loading',
      }
      ws.send(JSON.stringify(msg))
    })
  })

  // **********answer**********
  const queryRes = conn.getDataToCsv(query, params)
  queryRes
    .then(() => {
      res.end('query is ok!!!!')
    })
    .catch((err) => {
      res.status(400)
      res.end(err.message)
    })
    .finally(() => {
      wsClients.forEach((ws) => {
        const msg = {
          user,
          text: 'finish',
        }
        ws.send(JSON.stringify(msg))
      })
    })
}

export { connHandler }
