'use client'

import { useEffect, useState } from 'react'

interface HealthData {
  status: string
  database: string
  indexedFiles: number
  diskUsage: string
  timestamp: string
}

interface SearchResult {
  file: string
  chunk: string
  score: number
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const fetchHealth = async () => {
      const res = await fetch('/dashboard/api/health')
      setHealth(await res.json())
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/dashboard/api/documents').then(r => r.json()).then(d => setDocuments(d.documents || []))
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const res = await fetch(`/dashboard/api/search?q=${encodeURIComponent(searchQuery)}`)
    const data = await res.json()
    setSearchResults(data.results || [])
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">QMD Dashboard</h1>

      <section className="mb-8 grid grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${health?.status === 'healthy' ? 'bg-green-900/50' : 'bg-yellow-900/50'}`}>
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-lg font-semibold">{health?.status || 'loading...'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800">
          <div className="text-sm text-gray-400">Database</div>
          <div className="text-lg font-semibold">{health?.database || 'loading...'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800">
          <div className="text-sm text-gray-400">Indexed Files</div>
          <div className="text-lg font-semibold">{health?.indexedFiles ?? 'loading...'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800">
          <div className="text-sm text-gray-400">Disk Usage</div>
          <div className="text-lg font-semibold">{health?.diskUsage || 'loading...'}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Semantic Search</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents semantically..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
          />
          <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((r, i) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>{r.file}</span>
                  <span>Score: {r.score?.toFixed(3)}</span>
                </div>
                <div className="text-gray-200">{r.chunk}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Indexed Documents ({documents.length})</h2>
        <div className="space-y-2">
          {documents.map((doc, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-lg flex justify-between">
              <span className="text-gray-200">{doc.file || doc.name || JSON.stringify(doc)}</span>
              <span className="text-gray-400 text-sm">{doc.chunks || '?'} chunks</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
