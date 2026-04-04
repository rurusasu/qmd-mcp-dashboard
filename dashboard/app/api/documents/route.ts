import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = execSync('qmd list --json 2>/dev/null || echo "[]"', { timeout: 10000 })
    const documents = JSON.parse(result.toString())
    return NextResponse.json({ documents, count: documents.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, documents: [], count: 0 }, { status: 500 })
  }
}
