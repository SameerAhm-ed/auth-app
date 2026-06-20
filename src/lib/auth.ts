import { SignJWT, jwtVerify } from 'jose'
import { JWT_SECRET, TOKEN_EXPIRY } from './constants'
import { Role } from './constants'

export interface JWTPayload {
  id: string
  name: string
  email: string
  role: Role
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}
