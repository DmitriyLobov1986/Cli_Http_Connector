// **********system**********
import * as url from 'node:url'
import * as path from 'node:path'

// **********server**********
import express from 'express'
import expressWs from 'express-ws'

// **********router**********
import mountApiRouter from './src/routes/api.js'

const app = express()
expressWs(app)

app.use(express.json())

//static
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const staticPath = [__dirname, '/node_modules/bootstrap/dist']
if (process.env.NOD_ENV === 'production') {
  staticPath.splice(1, 1, '..')
}

app.use(express.static(path.join(...staticPath)))

//pug
app.set('views', './src/views')
app.set('view engine', 'pug')

//api
app.use('/api', mountApiRouter())

const PORT = 2000
app.listen(PORT, '', () => {
  console.log(`server is listeninig on PORT ${PORT}`)
})
