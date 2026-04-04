import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const qmdData = process.env.QMD_DATA_DIR || '/data/qmd'

  let diskUsage = 'unknown'
  try {
    const stat = execSync(`du -sh ${qmdData} 2>/dev/null || echo "0\\t-"`)
    diskUsage = stat.toString().split('\t')[0].trim()
  } catch { /* ignore */ }

  const dbPath = `${qmdData}/index.sqlite`
  const dbExists = fs.existsSync(dbPath)

  let fileCount = 0
  try {
    const result = execSync('qmd stats --json 2>/dev/null || echo "{}"', { timeout: 5000 })
    const stats = JSON.parse(result.toString())
    fileCount = stats.documentCount || 0
  } catch { /* ignore */ }

  return NextResponse.json({
    status: dbExists ? 'healthy' : 'degraded',
    database: dbExists ? 'ok' : 'missing',
    indexedFiles: fileCount,
    diskUsage,
    timestamp: new Date().toISOString(),
  })
}
