import { renderHook, waitFor } from '@testing-library/react'
import { useApi, usePortfolio, useNotifications } from '@/hooks/useApi'
import { api } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    portfolio: {
      getAll: jest.fn(),
    },
    notifications: {
      getAll: jest.fn(),
    },
  },
}))

const mockApi = api as jest.Mocked<typeof api>

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useApi', () => {
    it('should fetch data successfully', async () => {
      const mockData = { success: true, data: 'test data' }
      mockApi.portfolio.getAll.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => 
        useApi(() => api.portfolio.getAll())
      )

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })

    it('should handle errors', async () => {
      const mockError = new Error('API Error')
      mockApi.portfolio.getAll.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => 
        useApi(() => api.portfolio.getAll())
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('API Error')
    })

    it('should refetch data', async () => {
      const mockData = { success: true, data: 'test data' }
      mockApi.portfolio.getAll.mockResolvedValue(mockData)

      const { result } = renderHook(() => 
        useApi(() => api.portfolio.getAll())
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.portfolio.getAll).toHaveBeenCalledTimes(1)

      // Trigger refetch
      result.current.refetch()

      await waitFor(() => {
        expect(mockApi.portfolio.getAll).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('usePortfolio', () => {
    it('should fetch portfolio data', async () => {
      const mockPortfolio = {
        success: true,
        portfolio: [
          {
            _id: '1',
            ticker: 'AAPL',
            shares: 10,
            entryPrice: 150,
            currentPrice: 155,
            action: 'BUY',
            portfolioType: 'solid',
            portfolioId: 'solid-1'
          }
        ],
        totals: {
          initial: 1500,
          current: 1550,
          totalPnL: 50,
          totalPnLPercent: 3.33
        }
      }

      mockApi.portfolio.getAll.mockResolvedValueOnce(mockPortfolio)

      const { result } = renderHook(() => usePortfolio())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockPortfolio)
      expect(mockApi.portfolio.getAll).toHaveBeenCalledWith({})
    })

    it('should fetch portfolio data with filters', async () => {
      const mockPortfolio = { success: true, portfolio: [], totals: {} }
      mockApi.portfolio.getAll.mockResolvedValueOnce(mockPortfolio)

      const { result } = renderHook(() => 
        usePortfolio('solid', 'solid-1')
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.portfolio.getAll).toHaveBeenCalledWith({
        portfolioType: 'solid',
        portfolioId: 'solid-1'
      })
    })
  })

  describe('useNotifications', () => {
    it('should fetch notifications data', async () => {
      const mockNotifications = {
        success: true,
        notifications: [
          {
            id: '1',
            userId: 'user1',
            type: 'info',
            title: 'Test Notification',
            message: 'Test message',
            isRead: false,
            priority: 'medium',
            createdAt: '2025-10-15T10:00:00Z'
          }
        ],
        unreadCount: 1
      }

      mockApi.notifications.getAll.mockResolvedValueOnce(mockNotifications)

      const { result } = renderHook(() => useNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockNotifications)
      expect(mockApi.notifications.getAll).toHaveBeenCalledTimes(1)
    })
  })
})
