import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'
import { useDb, schema } from '~/server/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const body = await readBody<{
    status?: 'cancelled' | 'executed'
    processingNotes?: string
  }>(event)

  const db = useDb()

  // Fetch the existing order
  const [existing] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1)

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

  // Non-admin can only cancel their own orders
  if (!user.isAdmin) {
    if (existing.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (body.status && body.status !== 'cancelled') {
      throw createError({ statusCode: 403, statusMessage: 'You can only cancel orders' })
    }
  }

  const updates: Partial<typeof schema.orders.$inferInsert> = {}

  if (body.status) {
    updates.status = body.status
    if (body.status === 'executed' || body.status === 'cancelled') {
      updates.processedAt = new Date()
      if (user.isAdmin) updates.processedBy = user.id
    }
  }

  if (user.isAdmin && body.processingNotes !== undefined) {
    updates.processingNotes = body.processingNotes
  }

  const [order] = await db
    .update(schema.orders)
    .set(updates)
    .where(eq(schema.orders.id, id))
    .returning()

  return { order }
})
