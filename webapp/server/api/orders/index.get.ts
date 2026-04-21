import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'
import { useDb, schema } from '~/server/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const rows = await db
    .select({
      id:              schema.orders.id,
      companyWallet:   schema.orders.companyWallet,
      contractAddress: schema.orders.contractAddress,
      contractName:    schema.orders.contractName,
      abbreviation:    schema.orders.abbreviation,
      side:            schema.orders.side,
      orderType:       schema.orders.orderType,
      amount:          schema.orders.amount,
      limitPrice:      schema.orders.limitPrice,
      stopPrice:       schema.orders.stopPrice,
      notes:           schema.orders.notes,
      status:          schema.orders.status,
      createdAt:       schema.orders.createdAt,
      processedAt:     schema.orders.processedAt,
    })
    .from(schema.orders)
    .where(eq(schema.orders.userId, user.id))
    .orderBy(desc(schema.orders.createdAt))

  return { orders: rows }
})
