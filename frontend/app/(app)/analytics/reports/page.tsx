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
  const [newsInsights, setNewsInsights] = useState<any>(null);
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
        const insights = newsRes.data.insights || null;
        setNews(newsData);
        setNewsInsights(insights);
        console.log(`✅ [REPORTS] Loaded ${newsData.length} news articles with insights`);
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
        <div className="text-center">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
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
          {/* Left Column: Balance Sheet + News */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Sheet Health Analysis - ORIGINAL MOVED TO TOP & ENHANCED */}
            {portfolio.length > 0 && (
              <div className="card p-6 bg-gradient-to-br from-slate-800/95 via-blue-900/10 to-slate-900/95 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/40">
                      <Building2 className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Balance Sheet Health Analysis</h3>
                      <p className="text-xs text-slate-400">Warren Buffett's 13-Point Financial Scorecard</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-5 bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                  📊 <span className="font-semibold">Fundamental analysis</span> based on 13 financial criteria. Must pass <span className="text-green-400 font-bold">8/13</span> to be considered healthy for investment.
                </p>
                
                {balanceSheetAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-2">Loading financial data...</p>
                    <p className="text-xs text-slate-500">
                      Analyzing balance sheets from FMP, Alpha Vantage, and Finnhub APIs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {balanceSheetAnalyses.map((analysis, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/40 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                      {/* Stock Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-white">{analysis.ticker}</span>
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg ${
                            analysis.eligible 
                              ? 'bg-green-500/30 text-green-300 border-2 border-green-400/50' 
                              : 'bg-red-500/30 text-red-300 border-2 border-red-400/50'
                          }`}>
                            {analysis.eligible ? '✅ HEALTHY' : '⚠️ WEAK'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-black ${
                            analysis.eligible ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {analysis.score}/{analysis.maxScore}
                          </div>
                          <div className="text-xs text-slate-400 font-semibold">BUFFETT SCORE</div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      {analysis.recommendation && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-blue-900/30 border border-blue-500/30">
                          <div className="text-sm font-semibold text-blue-300">
                            💡 {analysis.recommendation}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Red Flags Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        {analysis.reasons && analysis.reasons.length > 0 && (
                          <div className="bg-green-900/10 rounded-lg p-4 border border-green-500/30">
                            <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center">
                              <span className="mr-2">✔</span> STRENGTHS
                            </h5>
                            <div className="space-y-2">
                              {analysis.reasons.map((reason: string, idx: number) => (
                                <div key={idx} className="text-sm text-slate-200 flex items-start leading-relaxed">
                                  <span className="text-green-400 mr-2 font-bold">•</span>
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Red Flags */}
                        {analysis.redFlags && analysis.redFlags.length > 0 && (
                          <div className="bg-red-900/10 rounded-lg p-4 border border-red-500/30">
                            <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center">
                              <span className="mr-2">✘</span> RED FLAGS
                            </h5>
                            <div className="space-y-2">
                              {analysis.redFlags.map((flag: string, idx: number) => (
                                <div key={idx} className="text-sm text-slate-200 flex items-start leading-relaxed">
                                  <span className="text-red-400 mr-2 font-bold">•</span>
                                  <span>{flag}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* News Insights Summary - NEW */}
            {newsInsights && (
              <div className="card p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  News Intelligence
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                    <div className="text-[10px] text-slate-400 mb-1">Total Coverage</div>
                    <div className="text-lg font-bold text-white">{newsInsights.totalArticles}</div>
                  </div>
                  <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-[10px] text-green-400 mb-1">Positive</div>
                    <div className="text-lg font-bold text-green-400">{newsInsights.sentimentBreakdown.positive}</div>
                  </div>
                  <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
                    <div className="text-[10px] text-yellow-400 mb-1">Neutral</div>
                    <div className="text-lg font-bold text-yellow-400">{newsInsights.sentimentBreakdown.neutral}</div>
                  </div>
                  <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                    <div className="text-[10px] text-red-400 mb-1">Negative</div>
                    <div className="text-lg font-bold text-red-400">{newsInsights.sentimentBreakdown.negative}</div>
                  </div>
                </div>
                {newsInsights.tickerMentions.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-slate-400 mb-2">Most Mentioned Stocks:</div>
                    <div className="flex flex-wrap gap-2">
                      {newsInsights.tickerMentions.slice(0, 5).map((mention: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                          {mention.ticker} ({mention.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Latest News - Reduced to 10 articles */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Latest News (Top 10)
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
                    <div key={index} className={`border-l-4 rounded-lg p-4 mb-4 last:mb-0 ${
                      article.sentiment === 'positive' 
                        ? 'border-green-500 bg-green-900/10' 
                        : article.sentiment === 'negative'
                        ? 'border-red-500 bg-red-900/10'
                        : 'border-slate-600 bg-slate-800/30'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          article.sentiment === 'positive' 
                            ? 'bg-green-500/20' 
                            : article.sentiment === 'negative'
                            ? 'bg-red-500/20'
                            : 'bg-slate-700/30'
                        }`}>
                          {getReportTypeIcon(article.sentiment === 'positive' ? 'earnings' : 'news')}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-semibold text-sm leading-tight flex-1 pr-2">{article.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                              article.sentiment === 'positive' 
                                ? 'bg-green-500/30 text-green-300' 
                                : article.sentiment === 'negative'
                                ? 'bg-red-500/30 text-red-300'
                                : 'bg-slate-600/30 text-slate-300'
                            }`}>
                              {article.sentiment}
                            </span>
                          </div>
                          
                          {/* Actionable Insight */}
                          {article.insight && (
                            <div className={`mb-2 px-3 py-2 rounded-lg text-xs leading-relaxed ${
                              article.sentiment === 'positive' 
                                ? 'bg-green-900/20 text-green-200 border border-green-500/20' 
                                : article.sentiment === 'negative'
                                ? 'bg-red-900/20 text-red-200 border border-red-500/20'
                                : 'bg-slate-800/50 text-slate-300 border border-slate-600/20'
                            }`}>
                              <span className="font-semibold">💡 Investment Impact:</span> {article.insight}
                            </div>
                          )}
                          
                          {/* Summary */}
                          {article.summary && article.summary !== article.title && (
                            <p className="text-xs text-slate-400 mb-2 line-clamp-2 leading-relaxed">
                              {article.summary}
                            </p>
                          )}
                          
                          {/* Meta Info */}
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center">
                              📰 {article.source}
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-blue-400">{article.ticker}</span>
                            <span>•</span>
                            <span>{article.date}</span>
                            {article.url && article.url !== '#' && (
                              <>
                                <span>•</span>
                                <a 
                                  href={article.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  Read full article →
                                </a>
                              </>
                            )}
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
    </div>
  );
}
