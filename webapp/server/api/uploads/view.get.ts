import { requireAuth } from '~/server/utils/auth'
import { createPresignedView } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'url is required' })
  }

  const config = useRuntimeConfig()
  const publicBase = config.public.r2PublicUrl as string

  if (!url.startsWith(publicBase + '/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  const key = url.slice(publicBase.length + 1)

  const signedUrl = await createPresignedView(key)
  return sendRedirect(event, signedUrl, 307)
})
