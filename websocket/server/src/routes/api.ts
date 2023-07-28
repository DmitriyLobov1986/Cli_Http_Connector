// **********express**********
import express, { Router } from 'express'

// **********controllers**********
import { connHandler } from '../controllers/connector.js'
import { wsHandler, getActiveUsers } from '../controllers/ws.js'
import expressWs from 'express-ws'

const mountRouter = (): expressWs.Router => {
  const router = express.Router()

  // ping route
  router.get('/', (req, res) => {
    res.render('ping')
  })

  // websocket
  router.ws('/ws', wsHandler)

  // data route
  router.post('/connector', connHandler)

  // users route
  router.get('/users', getActiveUsers)

  return router
}

export default mountRouter
