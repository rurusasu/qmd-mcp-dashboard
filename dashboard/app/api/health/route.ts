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
  } catch {
    /* ignore */
  }

  const dbPath = `${qmdData}/index.sqlite`
  const dbExists = fs.existsSync(dbPath)

  // Get QMD stats
  let stats: Record<string, unknown> = {}
  try {
    const result = execSync('qmd stats --json 2>/dev/null || echo "{}"', { timeout: 5000 })
    stats = JSON.parse(result.toString())
  } catch {
    /* ignore */
  }

  // Get DB file size
  let dbSizeBytes = 0
  try {
    if (dbExists) {
      const stat = fs.statSync(dbPath)
      dbSizeBytes = stat.size
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    status: dbExists ? 'healthy' : 'degraded',
    database: dbExists ? 'ok' : 'missing',
    indexedFiles: stats.documentCount ?? stats.document_count ?? 0,
    chunkCount: stats.chunkCount ?? stats.chunk_count ?? 0,
    collectionCount: stats.collectionCount ?? stats.collection_count ?? 0,
    diskUsage,
    dbSizeBytes,
    timestamp: new Date().toISOString(),
  })
}
