// **********server**********
import express from 'express'
import expressWs from 'express-ws'

// **********controllers**********
import { connHandler } from './controllers/connector.js'
import { wsHandler, getActiveUsers } from './controllers/ws.js'

const app = express()
const { app: appWs } = expressWs(app)

app.use(express.json())

// ping route
app.get('/', (req, res) => {
  const ping = '<h4>ping is ok!!!!</h4>'
  res.set('Content-Type', 'text/html')
  res.end(ping)
})

// data route
app.post('/connector', connHandler)

// users route
app.get('/users', getActiveUsers)

// ws route
appWs.ws('/ws', wsHandler)

const PORT = 2000
app.listen(PORT, '', () => {
  console.log(`server is listeninig on PORT ${PORT}`)
})
