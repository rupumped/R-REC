import { requireBuyer } from '~/server/utils/auth'
import { useDb, schema } from '~/server/db'

interface CreateOrderBody {
  contractAddress?: string
  contractName?: string
  abbreviation?: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit'
  amount: number
  limitPrice?: number
  stopPrice?: number
  notes?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireBuyer(event)
  const body = await readBody<CreateOrderBody>(event)

  if (!body?.side || !body?.orderType || !body?.amount) {
    throw createError({ statusCode: 400, statusMessage: 'side, orderType, and amount are required' })
  }

  if (!['buy', 'sell'].includes(body.side)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid side' })
  }

  if (!['market', 'limit', 'stop', 'stop-limit'].includes(body.orderType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid orderType' })
  }

  if (!Number.isInteger(body.amount) || body.amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive integer' })
  }

  if (!user.companyWallet) {
    throw createError({ statusCode: 400, statusMessage: 'Account not linked to a company wallet' })
  }

  const db = useDb()
  const [order] = await db
    .insert(schema.orders)
    .values({
      userId:          user.id,
      companyWallet:   user.companyWallet,
      contractAddress: body.contractAddress,
      contractName:    body.contractName,
      abbreviation:    body.abbreviation,
      side:            body.side,
      orderType:       body.orderType,
      amount:          body.amount,
      limitPrice:      body.limitPrice?.toString(),
      stopPrice:       body.stopPrice?.toString(),
      notes:           body.notes,
      status:          'pending',
    })
    .returning()

  return { order }
})
