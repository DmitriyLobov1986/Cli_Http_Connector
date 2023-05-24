// **********system**********
import * as url from 'url'

// **********server**********
import express from 'express'
import expressWs from 'express-ws'

// **********controllers**********
import { connHandler } from './src/controllers/connector.js'
import { wsHandler, getActiveUsers } from './src/controllers/ws.js'

const app = express()
const { app: appWs } = expressWs(app)

app.use(express.json())

//static
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'))

//pug
app.set('views', './src/views')
app.set('view engine', 'pug')

// ping route
app.get('/', (req, res) => {
  res.render('ping')
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
