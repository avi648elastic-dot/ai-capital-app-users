'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FileText, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function Reports() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

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

      const [portfolioRes, newsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Mock news data - in real app, this would be from a news API
        Promise.resolve({ data: { news: [] } })
      ]);
      
      setPortfolio(portfolioRes.data.portfolio || []);
      setNews([
        {
          id: 1,
          title: "Apple Reports Strong Q4 Earnings",
          source: "Financial Times",
          date: "2024-01-15",
          ticker: "AAPL",
          type: "earnings"
        },
        {
          id: 2,
          title: "Microsoft Announces New AI Initiatives",
          source: "Reuters",
          date: "2024-01-14",
          ticker: "MSFT",
          type: "news"
        },
        {
          id: 3,
          title: "Tesla Stock Analysis: Bull vs Bear Case",
          source: "MarketWatch",
          date: "2024-01-13",
          ticker: "TSLA",
          type: "analysis"
        }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingEarnings = () => {
    // Mock upcoming earnings - in real app, this would be from an earnings API
    return [
      { ticker: 'AAPL', date: '2024-02-01', time: 'After Market Close' },
      { ticker: 'MSFT', date: '2024-02-15', time: 'After Market Close' },
      { ticker: 'TSLA', date: '2024-02-28', time: 'After Market Close' },
    ];
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
                  <p className="text-slate-400 text-center py-8">No recent news available</p>
                ) : (
                  news.map((article) => (
                    <div key={article.id} className="border-b border-slate-800 pb-4 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        {getReportTypeIcon(article.type)}
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
                {getUpcomingEarnings().map((earning, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{earning.ticker}</div>
                      <div className="text-sm text-slate-400">{earning.time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">{earning.date}</div>
                    </div>
                  </div>
                ))}
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
                    ${portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total P&L</span>
                  <span className="text-green-400">
                    +${portfolio.reduce((sum, stock) => {
                      const cost = stock.entryPrice * stock.shares;
                      const value = stock.currentPrice * stock.shares;
                      return sum + (value - cost);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
