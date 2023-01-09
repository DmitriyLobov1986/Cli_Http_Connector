// **********server**********
import express from 'express'
import expressWs from 'express-ws'

// **********controllers**********
import { connHandler } from './controllers/connector.js'
import { wsHandler } from './controllers/ws.js'

const app = express()
expressWs(app)

app.use(express.json())

app.get('/', (req, res) => {
  const ping = '<h4>ping is ok!!!!</h4>'
  res.set('Content-Type', 'text/html')
  res.end(ping)
})

app.post('/connector', connHandler)

// @ts-ignore
app.ws('/ws', wsHandler)

const PORT = 2000
app.listen(PORT, undefined, () => {
  // eslint-disable-next-line no-console
  console.log(`server is listeninig on PORT ${PORT}`)
})
