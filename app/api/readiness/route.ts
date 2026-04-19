import { NextResponse } from 'next/server'

let ready = false

// Signal ready after initialization
setTimeout(() => {
  ready = true
}, 0)

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ready, timestamp: new Date().toISOString() },
    { status: ready ? 200 : 503 },
  )
}
