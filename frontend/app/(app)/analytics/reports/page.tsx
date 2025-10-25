"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FileText, Calendar, TrendingUp, AlertCircle, Building2 } from 'lucide-react';

export default function Reports() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [balanceSheetAnalyses, setBalanceSheetAnalyses] = useState<any[]>([]);

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = Cookies.get('token');
      
      // Fetch user data
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data.user);

      // Fetch portfolio data
      const portfolioRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const portfolio = portfolioRes.data.portfolio || [];
      setPortfolio(portfolio);

      // Fetch real portfolio metrics from analytics API
      try {
        const analyticsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (analyticsRes.data && analyticsRes.data.portfolioPerformance && analyticsRes.data.portfolioPerformance.length > 0) {
          const latest = analyticsRes.data.portfolioPerformance[analyticsRes.data.portfolioPerformance.length - 1];
          setPortfolioMetrics({
            totalValue: latest.value || latest.totalValue || 0,
            totalPnL: latest.pnl || latest.totalPnL || 0,
            totalPnLPercent: latest.pnlPercent || latest.totalPnLPercent || 0
          });
        }
      } catch (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }

      // Fetch news from backend API
      try {
        const newsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/news`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        });
        const newsData = newsRes.data.news || [];
        setNews(newsData);
        console.log(`✅ [REPORTS] Loaded ${newsData.length} news articles`);
      } catch (newsError) {
        console.error('❌ [REPORTS] Error fetching news:', newsError);
        setNews([]);
      }

      // Fetch earnings calendar from backend API
      try {
        const earningsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/earnings-calendar`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        });
        const earningsData = earningsRes.data.earnings || [];
        setEarnings(earningsData);
        console.log(`✅ [REPORTS] Loaded ${earningsData.length} upcoming earnings`);
      } catch (earningsError) {
        console.error('❌ [REPORTS] Error fetching earnings:', earningsError);
        setEarnings([]);
      }

      // Fetch balance sheet analyses for portfolio stocks
      if (portfolio.length > 0) {
        try {
          const balanceSheetRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/balance-sheet`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 20000
          });
          const analysesData = balanceSheetRes.data.analyses || [];
          setBalanceSheetAnalyses(analysesData);
          console.log(`✅ [REPORTS] Loaded ${analysesData.length} balance sheet analyses`);
        } catch (balanceSheetError) {
          console.error('❌ [REPORTS] Error fetching balance sheet analyses:', balanceSheetError);
          setBalanceSheetAnalyses([]);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingEarnings = () => {
    // Use real earnings data from backend API
    return earnings;
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'news': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'analysis': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reports & News</h1>
          <p className="text-slate-400">Latest news, earnings, and analysis for your portfolio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Latest News
              </h3>
              <div className="space-y-4">
                {news.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-2">No recent news available</p>
                    <p className="text-xs text-slate-500">
                      News is fetched from external APIs for your portfolio stocks
                    </p>
                  </div>
                ) : (
                  news.map((article, index) => (
                    <div key={index} className="border-b border-slate-800 pb-4 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        {getReportTypeIcon(article.sentiment === 'positive' ? 'earnings' : 'news')}
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{article.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span>{article.source}</span>
                            <span>•</span>
                            <span>{article.ticker}</span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Earnings
              </h3>
              <div className="space-y-3">
                {getUpcomingEarnings().length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm mb-1">No upcoming earnings</p>
                    <p className="text-xs text-slate-500">
                      Earnings data is fetched from external APIs
                    </p>
                  </div>
                ) : (
                  getUpcomingEarnings().map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{earning.ticker}</div>
                        <div className="text-sm text-slate-400">{earning.time}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">{earning.date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Stocks</span>
                  <span className="text-white">{portfolio.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Portfolio Value</span>
                  <span className="text-white">
                    ${portfolioMetrics ? portfolioMetrics.totalValue.toFixed(2) : 
                      portfolio.reduce((sum, stock) => sum + ((stock.currentPrice || stock.entryPrice) * stock.shares), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total P&L</span>
                  <span className={portfolioMetrics && portfolioMetrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {portfolioMetrics ? (
                      <>
                        {portfolioMetrics.totalPnL >= 0 ? '+' : ''}${portfolioMetrics.totalPnL.toFixed(2)}
                        <span className="text-slate-400 ml-2">({portfolioMetrics.totalPnLPercent.toFixed(2)}%)</span>
                      </>
                    ) : (
                      `$${portfolio.reduce((sum, stock) => {
                        const cost = stock.entryPrice * stock.shares;
                        const value = (stock.currentPrice || stock.entryPrice) * stock.shares;
                        return sum + (value - cost);
                      }, 0).toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Sheet Health Section */}
        {portfolio.length > 0 && (
          <div className="mt-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Balance Sheet Health Analysis
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Fundamental analysis based on 13 financial criteria (must pass 8/13 to be considered healthy)
              </p>
              
              {balanceSheetAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-2">No financial data available</p>
                  <p className="text-xs text-slate-500">
                    Financial data is fetched from external APIs (FMP, Alpha Vantage, Finnhub)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balanceSheetAnalyses.map((analysis, index) => (
                  <div key={index} className="border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold text-lg">{analysis.ticker}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.eligible 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {analysis.eligible ? 'HEALTHY' : 'WEAK'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          analysis.eligible ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {analysis.score}/{analysis.maxScore}
                        </div>
                        <div className="text-xs text-slate-400">Score</div>
                      </div>
                    </div>

                    {analysis.recommendation && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-blue-400">
                          {analysis.recommendation}
                        </span>
                      </div>
                    )}

                    {analysis.reasons && analysis.reasons.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-slate-400 mb-2">STRENGTHS:</h5>
                        <div className="space-y-1">
                          {analysis.reasons.slice(0, 3).map((reason: string, idx: number) => (
                            <div key={idx} className="text-xs text-green-300 flex items-start">
                              <span className="mr-1">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.redFlags && analysis.redFlags.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-slate-400 mb-2">RED FLAGS:</h5>
                        <div className="space-y-1">
                          {analysis.redFlags.slice(0, 3).map((flag: string, idx: number) => (
                            <div key={idx} className="text-xs text-red-300 flex items-start">
                              <span className="mr-1">•</span>
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
