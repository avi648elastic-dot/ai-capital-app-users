import { render, screen, waitFor } from '@testing-library/react'
import { PortfolioTable } from '@/components/PortfolioTable'

// Mock the API hooks
jest.mock('@/hooks/useApi', () => ({
  usePortfolio: () => ({
    data: {
      portfolio: [
        {
          _id: '1',
          ticker: 'AAPL',
          shares: 10,
          entryPrice: 150,
          currentPrice: 155,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1',
          createdAt: '2025-10-15T10:00:00Z',
          updatedAt: '2025-10-15T10:00:00Z'
        },
        {
          _id: '2',
          ticker: 'GOOGL',
          shares: 5,
          entryPrice: 2800,
          currentPrice: 2850,
          action: 'BUY',
          portfolioType: 'solid',
          portfolioId: 'solid-1',
          createdAt: '2025-10-15T10:00:00Z',
          updatedAt: '2025-10-15T10:00:00Z'
        }
      ],
      totals: {
        initial: 29000,
        current: 29450,
        totalPnL: 450,
        totalPnLPercent: 1.55
      }
    },
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}))

describe('PortfolioTable Component', () => {
  it('should render portfolio data', async () => {
    render(<PortfolioTable />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('GOOGL')).toBeInTheDocument()
    })

    // Check if totals are displayed
    expect(screen.getByText('$29,000.00')).toBeInTheDocument() // Initial value
    expect(screen.getByText('$29,450.00')).toBeInTheDocument() // Current value
    expect(screen.getByText('$450.00')).toBeInTheDocument() // P&L
    expect(screen.getByText('1.55%')).toBeInTheDocument() // P&L percentage
  })

  it('should display stock details correctly', async () => {
    render(<PortfolioTable />)

    await waitFor(() => {
      // Check AAPL details
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Shares
      expect(screen.getByText('$150.00')).toBeInTheDocument() // Entry price
      expect(screen.getByText('$155.00')).toBeInTheDocument() // Current price

      // Check GOOGL details
      expect(screen.getByText('GOOGL')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // Shares
      expect(screen.getByText('$2,800.00')).toBeInTheDocument() // Entry price
      expect(screen.getByText('$2,850.00')).toBeInTheDocument() // Current price
    })
  })

  it('should show loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/useApi', () => ({
      usePortfolio: () => ({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      })
    }))

    render(<PortfolioTable />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    // Mock error state
    jest.doMock('@/hooks/useApi', () => ({
      usePortfolio: () => ({
        data: null,
        loading: false,
        error: 'Failed to load portfolio',
        refetch: jest.fn()
      })
    }))

    render(<PortfolioTable />)
    expect(screen.getByText('Failed to load portfolio')).toBeInTheDocument()
  })

  it('should show empty state when no portfolio items', () => {
    // Mock empty state
    jest.doMock('@/hooks/useApi', () => ({
      usePortfolio: () => ({
        data: {
          portfolio: [],
          totals: {
            initial: 0,
            current: 0,
            totalPnL: 0,
            totalPnLPercent: 0
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      })
    }))

    render(<PortfolioTable />)
    expect(screen.getByText('No stocks in portfolio')).toBeInTheDocument()
  })
})
