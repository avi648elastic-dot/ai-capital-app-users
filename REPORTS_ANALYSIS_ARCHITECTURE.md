# Reports & Analysis Page - Architecture & Implementation Plan

## 🏗️ Architecture Overview

The **Reports & Analysis page** (`/analytics/reports`) follows a **multi-source aggregation architecture** that consolidates financial news, earnings calendars, and balance sheet analyses from external APIs into a unified dashboard. The system uses a **component-based React frontend** that fetches data in parallel from three backend endpoints (`/api/analytics/news`, `/api/analytics/earnings-calendar`, `/api/analytics/balance-sheet`), with each endpoint independently caching results in Redis to minimize external API calls. The page displays portfolio-tagged news articles, upcoming earnings events filtered by portfolio holdings, and financial health analyses derived from balance sheet data, with graceful error handling that allows partial data rendering if any source fails.

## 📋 Implementation System

**Backend**: Three separate Express routes (`news.ts`, `earnings.ts`, `balance-sheet.ts`) each with their own caching strategy (24-hour TTL for news, daily refresh for earnings calendar, and weekly refresh for balance sheets). Each route uses API key rotation across multiple providers (Finnhub, Alpha Vantage, Financial Modeling Prep) with fallback mechanisms. **Frontend**: Single-page component (`reports/page.tsx`) that renders three main sections—News Feed (scrollable list with timestamps), Earnings Calendar (upcoming events in next 30 days), and Balance Sheet Analysis (financial ratios per stock). Data fetching uses `axios` with parallel requests on mount, error boundaries for individual sections, and loading states per data source. **Caching**: Redis-based with daily key expiration, ensuring fresh data each morning while serving cached responses during high-traffic periods.

## 🔄 Data Flow

**User visits page → Frontend triggers 3 parallel API calls → Backend checks Redis cache → If miss, fetches from external APIs (Finnhub/AlphaVantage/FMP) → Caches results → Returns aggregated JSON → Frontend renders News cards, Earnings calendar, and Analysis tables → User can filter by date/stock/tag.** Each section is independently cacheable and can render even if other sections fail, ensuring robust UX.

