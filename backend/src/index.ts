import 'dotenv/config'
// OPT-IN ONLY: disables TLS certificate verification process-wide. Some Windows dev
// setups hit a Supabase cert-chain issue on schannel; set ALLOW_INSECURE_TLS=1 in a
// local .env to work around it. NEVER enable this in any deployed environment.
if (process.env.ALLOW_INSECURE_TLS === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.warn('⚠️  TLS certificate verification DISABLED (ALLOW_INSECURE_TLS=1). Local dev only — never in production.')
}
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './middleware/auth.js'
import elders from './routes/elders.js'
import visits from './routes/visits.js'
import flagsRoute from './routes/flags.js'
import familyRoute from './routes/family.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }))

app.get('/', (c) => c.json({ status: 'ok', project: 'CareBridge 康橋' }))

// All /api/* routes require a Supabase JWT
app.use('/api/*', auth)
app.route('/api/elders', elders)
app.route('/api/visits', visits)
app.route('/api/flags', flagsRoute)
app.route('/api/family', familyRoute)

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`CareBridge API → http://localhost:${info.port}`)
})

export default app
