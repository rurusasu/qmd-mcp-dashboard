'use client'

import { useEffect, useState } from 'react'

interface HealthData {
  status: string
  database: string
  indexedFiles: number
  chunkCount: number
  collectionCount: number
  diskUsage: string
  dbSizeBytes: number
  timestamp: string
}

interface SearchResult {
  file: string
  chunk: string
  score: number
}

interface Document {
  file?: string
  name?: string
  chunks?: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/dashboard/api/health')
        setHealth(await res.json())
      } catch {
        /* ignore */
      }
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/dashboard/api/documents')
      .then((r) => r.json())
      .then((d) => setDocuments(Array.isArray(d.documents) ? d.documents : []))
      .catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`/dashboard/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(Array.isArray(data.results) ? data.results : [])
    } catch {
      /* ignore */
    }
    setIsSearching(false)
  }

  const statusColor = (val: string, good: string) =>
    val === good ? 'bg-green-900/50 border-green-700' : 'bg-yellow-900/50 border-yellow-700'

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">QMD Dashboard</h1>

      {/* Health Status Cards */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`p-4 rounded-lg border ${statusColor(health?.status || '', 'healthy')}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Status</div>
          <div className="text-lg font-semibold mt-1">{health?.status || '...'}</div>
        </div>
        <div className={`p-4 rounded-lg border ${statusColor(health?.database || '', 'ok')}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Database</div>
          <div className="text-lg font-semibold mt-1">{health?.database || '...'}</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Files</div>
          <div className="text-lg font-semibold mt-1">{health?.indexedFiles ?? '...'}</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Chunks</div>
          <div className="text-lg font-semibold mt-1">{health?.chunkCount ?? '...'}</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 uppercase tracking-wide">DB Size</div>
          <div className="text-lg font-semibold mt-1">
            {health ? formatBytes(health.dbSizeBytes) : '...'}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Disk</div>
          <div className="text-lg font-semibold mt-1">{health?.diskUsage || '...'}</div>
        </div>
      </section>

      {/* Semantic Search */}
      <section className="mb-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Semantic Search</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents semantically..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-2 rounded-lg transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((r, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span className="font-mono text-xs">{r.file}</span>
                  <span className="text-blue-400">Score: {r.score?.toFixed(3)}</span>
                </div>
                <div className="text-gray-200 text-sm whitespace-pre-wrap">{r.chunk}</div>
              </div>
            ))}
          </div>
        )}
        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="text-gray-500 text-sm">No results found.</div>
        )}
      </section>

      {/* Indexed Documents */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Indexed Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">No documents indexed yet.</div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400 font-medium">File</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Chunks</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-3 text-gray-200 font-mono text-xs">
                      {doc.file || doc.name || JSON.stringify(doc)}
                    </td>
                    <td className="p-3 text-gray-400 text-right">{doc.chunks ?? '?'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Last updated */}
      <div className="mt-8 text-xs text-gray-600 text-center">
        Last updated:{' '}
        {health?.timestamp ? new Date(health.timestamp).toLocaleString('ja-JP') : '...'}
      </div>
    </main>
  )
}
