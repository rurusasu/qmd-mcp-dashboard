import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })
  }

  try {
    const escaped = query.replace(/"/g, '\\"')
    const result = execSync(`qmd search "${escaped}" --json 2>/dev/null || echo "[]"`, { timeout: 15000 })
    const results = JSON.parse(result.toString())
    return NextResponse.json({ results, count: results.length, query })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [], count: 0 }, { status: 500 })
  }
}
