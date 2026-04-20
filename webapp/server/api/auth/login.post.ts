import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { useDb, schema } from '~/server/db'
import type { SessionUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username: string; password: string }>(event)

  if (!body?.username || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })
  }

  const db = useDb()

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, body.username.trim().toLowerCase()))
    .limit(1)

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const sessionUser: SessionUser = {
    id:            user.id,
    username:      user.username,
    email:         user.email,
    companyWallet: user.companyWallet,
    isGenerator:   user.isGenerator,
    isBuyer:       user.isBuyer,
    isAdmin:       user.isAdmin,
  }

  await setUserSession(event, { user: sessionUser })

  return { ok: true, user: sessionUser }
})
