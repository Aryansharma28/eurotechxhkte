import { createMiddleware } from 'hono/factory'

type Variables = { token: string }

export const auth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('token', header.slice(7))
  await next()
})
