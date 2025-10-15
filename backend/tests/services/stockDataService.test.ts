import { stockDataService } from '../../src/services/stockDataService';

// Mock the external API calls
jest.mock('axios');
const axios = require('axios');

describe('Stock Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStockData', () => {
    it('should return stock data for valid ticker', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '02. open': '150.00',
            '03. high': '155.00',
            '04. low': '149.00',
            '05. price': '152.50',
            '06. volume': '1000000',
            '07. latest trading day': '2025-10-15',
            '08. previous close': '150.00',
            '09. change': '2.50',
            '10. change percent': '1.67%'
          }
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await stockDataService.getStockData('AAPL');

      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('price', 152.50);
      expect(result).toHaveProperty('change', 2.50);
      expect(result).toHaveProperty('changePercent', 1.67);
      expect(result).toHaveProperty('volume', 1000000);
    });

    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(stockDataService.getStockData('INVALID')).rejects.toThrow();
    });

    it('should handle missing data in response', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '152.50',
            '09. change': '2.50',
            '10. change percent': '1.67%'
            // Missing other fields
          }
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await stockDataService.getStockData('AAPL');

      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('price', 152.50);
      expect(result).toHaveProperty('change', 2.50);
      expect(result).toHaveProperty('changePercent', 1.67);
      expect(result.volume).toBe(0); // Default value for missing data
    });

    it('should use fallback providers when primary fails', async () => {
      // Mock primary provider failure
      axios.get.mockRejectedValueOnce(new Error('Primary provider failed'));

      // Mock fallback provider success
      const fallbackResponse = {
        data: {
          c: 152.50,
          h: 155.00,
          l: 149.00,
          o: 150.00,
          pc: 150.00,
          t: 1634567890
        }
      };

      axios.get.mockResolvedValueOnce(fallbackResponse);

      const result = await stockDataService.getStockData('AAPL');

      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('price', 152.50);
      expect(axios.get).toHaveBeenCalledTimes(2); // Primary + fallback
    });
  });

  describe('getMultipleStocks', () => {
    it('should fetch data for multiple stocks', async () => {
      const mockResponses = [
        {
          data: {
            'Global Quote': {
              '01. symbol': 'AAPL',
              '05. price': '152.50',
              '09. change': '2.50',
              '10. change percent': '1.67%'
            }
          }
        },
        {
          data: {
            'Global Quote': {
              '01. symbol': 'GOOGL',
              '05. price': '2800.00',
              '09. change': '50.00',
              '10. change percent': '1.82%'
            }
          }
        }
      ];

      axios.get
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await stockDataService.getMultipleStocks(['AAPL', 'GOOGL']);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('symbol', 'AAPL');
      expect(result[1]).toHaveProperty('symbol', 'GOOGL');
    });

    it('should handle partial failures in batch requests', async () => {
      const mockResponses = [
        {
          data: {
            'Global Quote': {
              '01. symbol': 'AAPL',
              '05. price': '152.50',
              '09. change': '2.50',
              '10. change percent': '1.67%'
            }
          }
        },
        new Error('API Error for GOOGL')
      ];

      axios.get
        .mockResolvedValueOnce(mockResponses[0])
        .mockRejectedValueOnce(mockResponses[1]);

      const result = await stockDataService.getMultipleStocks(['AAPL', 'GOOGL']);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('symbol', 'AAPL');
    });
  });

  describe('Caching', () => {
    it('should cache stock data', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '152.50',
            '09. change': '2.50',
            '10. change percent': '1.67%'
          }
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      // First call
      await stockDataService.getStockData('AAPL');
      
      // Second call should use cache
      await stockDataService.getStockData('AAPL');

      // Should only call API once due to caching
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '152.50',
            '09. change': '2.50',
            '10. change percent': '1.67%'
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // First call
      await stockDataService.getStockData('AAPL');
      
      // Wait for cache to expire (mock time)
      jest.advanceTimersByTime(25000); // 25 seconds
      
      // Second call should fetch fresh data
      await stockDataService.getStockData('AAPL');

      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when all providers fail', async () => {
      axios.get.mockRejectedValue(new Error('All providers failed'));

      await expect(stockDataService.getStockData('INVALID')).rejects.toThrow('All providers failed');
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      axios.get.mockRejectedValue(timeoutError);

      await expect(stockDataService.getStockData('AAPL')).rejects.toThrow('timeout');
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        data: {
          'Error Message': 'Invalid API call'
        }
      };

      axios.get.mockResolvedValueOnce(invalidResponse);

      await expect(stockDataService.getStockData('INVALID')).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const incompleteResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL'
            // Missing price and other required fields
          }
        }
      };

      axios.get.mockResolvedValueOnce(incompleteResponse);

      await expect(stockDataService.getStockData('AAPL')).rejects.toThrow();
    });

    it('should handle malformed numeric data', async () => {
      const malformedResponse = {
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': 'invalid',
            '09. change': 'invalid',
            '10. change percent': 'invalid%'
          }
        }
      };

      axios.get.mockResolvedValueOnce(malformedResponse);

      await expect(stockDataService.getStockData('AAPL')).rejects.toThrow();
    });
  });
});
