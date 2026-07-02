import { NextResponse } from 'next/server'

/**
 * Uniform JSON responder for data routes:
 *  - success → `{ data }` (200)
 *  - throw   → logs server-side + `{ error }` (500), never leaks internals.
 *
 * Call it INSIDE a route's `GET` function (this modified Next only registers
 * route methods declared as `export async function GET()`):
 *
 *   export async function GET() {
 *     return respondJson(() => query('am5', configAM5, 'SELECT * FROM x'))
 *   }
 */
export async function respondJson<T>(fn: () => Promise<T>, errorMessage = 'Failed to load data'): Promise<NextResponse> {
  try {
    return NextResponse.json({ data: await fn() })
  } catch (error) {
    console.error(errorMessage, error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
