import bcrypt from 'bcryptjs'
import { Role } from './constants'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
}

const users: User[] = []

async function seedUsers() {
  if (users.length > 0) return

  const hashes = await Promise.all([
    bcrypt.hash('admin123',    10),
    bcrypt.hash('am4pass123',  10),
    bcrypt.hash('am5pass123',  10),
    bcrypt.hash('am14pass123', 10),
    bcrypt.hash('am15pass123', 10),
    bcrypt.hash('multipass123',10),
    bcrypt.hash('manager123',  10),
  ])

  users.push(
    { id: '1', name: 'Admin User',    email: 'admin@test.com',   password: hashes[0], role: 'admin'     },
    { id: '2', name: 'AM4 User',      email: 'am4@test.com',     password: hashes[1], role: 'am4_user'  },
    { id: '3', name: 'AM5 User',      email: 'am5@test.com',     password: hashes[2], role: 'am5_user'  },
    { id: '4', name: 'AM14 User',     email: 'am14@test.com',    password: hashes[3], role: 'am14_user' },
    { id: '5', name: 'AM15 User',     email: 'am15@test.com',    password: hashes[4], role: 'am15_user' },
    { id: '6', name: 'Multi User',    email: 'multi@test.com',   password: hashes[5], role: 'multi_user'},
    { id: '7', name: 'Manager User',  email: 'manager@test.com', password: hashes[6], role: 'manager'   },
  )
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await seedUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  await seedUsers()
  return users.find((u) => u.id === id) ?? null
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: Role = 'am4_user',
): Promise<User> {
  await seedUsers()
  const existing = await findUserByEmail(email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(password, 10)
  const user: User = { id: String(Date.now()), name, email: email.toLowerCase(), password: hashed, role }
  users.push(user)
  return user
}
