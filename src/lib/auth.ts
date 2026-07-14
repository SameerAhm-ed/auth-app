import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { TOKEN_TTL, Role } from './constants'

// Mandatory in production; dev-only fallback so local runs work without setup.
// Lives here (not constants.ts) so the check never reaches a client bundle.
const DEV_SECRET = 'dev-only-insecure-secret-change-me'
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production')
}
const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET

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
