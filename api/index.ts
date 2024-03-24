/**
 * This file is needed so we can deploy on Vercel
 */

import { app } from '@/http/app'

export default async function handler(req: Request, res: Response) {
  await app.ready()

  app.server.emit('request', req, res)
}
