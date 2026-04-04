import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import DashboardPage from '../page'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'healthy', documents: [], results: [] }),
      })
    )
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('DashboardPage', () => {
  it('renders the page heading', () => {
    render(<DashboardPage />)
    expect(screen.getByText('QMD Dashboard')).toBeInTheDocument()
  })

  it('renders status cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Indexed Files')).toBeInTheDocument()
    expect(screen.getByText('Disk Usage')).toBeInTheDocument()
  })

  it('renders the search section', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Semantic Search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search documents semantically...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  it('renders the indexed documents section', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/Indexed Documents/)).toBeInTheDocument()
  })
})
