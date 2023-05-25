import { Service } from 'node-windows'

// Create a new service object
const svc = new Service({
  name: 'HttpConnector',
  description: 'http connector app',
  script: 'C:\\program\\JS\\connector\\websocket\\server\\build\\app.js',
  env: {
    name: 'NOD_ENV',
    value: 'production',
  },
})

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start()
})

svc.install()
// svc.uninstall()
