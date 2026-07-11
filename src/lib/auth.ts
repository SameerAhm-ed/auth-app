import { SignJWT, jwtVerify } from 'jose'
import { JWT_SECRET, TOKEN_TTL } from './constants'
import { Role } from './constants'

export interface JWTPayload {
  id: string
  name: string
  username: string
  role: Role
  sites: string[]
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.id as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as Role,
      sites: (payload.sites as string[]) ?? [],
    }
  } catch {
    return null
  }
}
