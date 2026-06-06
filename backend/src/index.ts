import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => c.json({ status: 'ok', project: 'CareBridge 康橋' }))

// add routes below as you build out the data model
// import { auth } from './middleware/auth.js'
// import elders from './routes/elders.js'
// import calls from './routes/calls.js'
// import flags from './routes/flags.js'
// import visits from './routes/visits.js'
//
// app.use('/api/*', auth)
// app.route('/api/elders', elders)
// app.route('/api/calls', calls)
// app.route('/api/flags', flags)
// app.route('/api/visits', visits)

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`CareBridge API running → http://localhost:${info.port}`)
})

export default app
