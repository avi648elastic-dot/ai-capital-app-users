'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Target, 
  Zap, 
  Shield, 
  Bell, 
  PieChart,
  LineChart,
  Activity,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();
  const [activeDemo, setActiveDemo] = useState('portfolio');

  const demoSections = [
    {
      id: 'portfolio',
      title: 'AI Portfolio Management',
      description: 'Watch AI automatically build and optimize your portfolio',
      icon: <Target className="w-6 h-6" />,
      features: ['Smart stock selection', 'Risk optimization', 'Auto-rebalancing', 'Performance tracking']
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Deep insights into your portfolio performance',
      icon: <BarChart3 className="w-6 h-6" />,
      features: ['Performance metrics', 'Risk analysis', 'Benchmark comparison', 'Historical data']
    },
    {
      id: 'watchlist',
      title: 'Real-Time Watchlist',
      description: 'Monitor stocks with instant alerts and updates',
      icon: <Eye className="w-6 h-6" />,
      features: ['Live price tracking', 'Custom alerts', 'Market notifications', 'Technical indicators']
    },
    {
      id: 'alerts',
      title: 'Smart Notifications',
      description: 'Never miss important market movements',
      icon: <Bell className="w-6 h-6" />,
      features: ['Price alerts', 'News notifications', 'Market updates', 'Custom triggers']
    }
  ];

  const mockPortfolioData = [
    { symbol: 'AAPL', shares: 100, price: 150.25, change: 2.15, changePercent: 1.45 },
    { symbol: 'MSFT', shares: 50, price: 420.80, change: -1.20, changePercent: -0.28 },
    { symbol: 'GOOGL', shares: 25, price: 2850.00, change: 15.50, changePercent: 0.55 },
    { symbol: 'TSLA', shares: 75, price: 245.30, change: -5.70, changePercent: -2.27 },
    { symbol: 'NVDA', shares: 30, price: 485.90, change: 12.40, changePercent: 2.62 }
  ];

  const mockAnalyticsData = [
    { metric: 'Total Return', value: '+$12,450', change: '+8.5%', positive: true },
    { metric: 'Risk Score', value: 'Medium', change: 'Stable', positive: true },
    { metric: 'Sharpe Ratio', value: '1.42', change: '+0.15', positive: true },
    { metric: 'Max Drawdown', value: '-5.2%', change: 'Improved', positive: true }
  ];

  const sectorPerformanceData = [
    {
      sector: 'Technology',
      allocation: '45%',
      performance: {
        '7d': '+2.3%',
        '30d': '+8.7%',
        '60d': '+15.2%',
        '90d': '+22.1%'
      },
      color: 'bg-blue-500'
    },
    {
      sector: 'Healthcare',
      allocation: '25%',
      performance: {
        '7d': '+1.8%',
        '30d': '+5.4%',
        '60d': '+9.8%',
        '90d': '+12.6%'
      },
      color: 'bg-green-500'
    },
    {
      sector: 'Finance',
      allocation: '20%',
      performance: {
        '7d': '-0.5%',
        '30d': '+2.1%',
        '60d': '+4.3%',
        '90d': '+7.9%'
      },
      color: 'bg-purple-500'
    },
    {
      sector: 'Energy',
      allocation: '10%',
      performance: {
        '7d': '+3.2%',
        '30d': '+12.4%',
        '60d': '+18.7%',
        '90d': '+25.3%'
      },
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AiCapital Demo</span>
            </div>
            <button
              onClick={() => router.push('/signup')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Experience AiCapital in Action
          </h1>
          <p className="text-xl text-slate-300">
            See how our AI-powered platform can transform your investment strategy
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {demoSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveDemo(section.id)}
              className={`p-4 rounded-lg border transition-all ${
                activeDemo === section.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center mb-2">
                {section.icon}
                <span className="ml-2 font-semibold">{section.title}</span>
              </div>
              <p className="text-sm opacity-75">{section.description}</p>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
          {activeDemo === 'portfolio' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">AI Portfolio Management</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Pause className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Your Portfolio</h3>
                  <div className="space-y-3">
                    {mockPortfolioData.map((stock, index) => (
                      <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">{stock.symbol}</div>
                            <div className="text-sm text-slate-400">{stock.shares} shares</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">${stock.price}</div>
                            <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}${stock.change} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
                  <div className="space-y-4">
                    <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Target className="w-5 h-5 text-green-400 mr-2" />
                        <span className="font-semibold text-green-300">Buy Recommendation</span>
                      </div>
                      <p className="text-sm text-green-200">AI suggests adding NVDA - strong momentum detected</p>
                    </div>
                    
                    <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="font-semibold text-blue-300">Risk Alert</span>
                      </div>
                      <p className="text-sm text-blue-200">Portfolio risk within acceptable range</p>
                    </div>
                    
                    <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Zap className="w-5 h-5 text-purple-400 mr-2" />
                        <span className="font-semibold text-purple-300">Rebalancing</span>
                      </div>
                      <p className="text-sm text-purple-200">AI recommends rebalancing in 3 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Advanced Analytics Dashboard</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {mockAnalyticsData.map((metric, index) => (
                      <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">{metric.metric}</div>
                        <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
                        <div className={`text-sm ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
                          {metric.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>
                  <div className="space-y-3">
                    {sectorPerformanceData.map((sector, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 ${sector.color} rounded mr-3`}></div>
                          <span className="text-white">{sector.sector}</span>
                        </div>
                        <span className="text-white font-semibold">{sector.allocation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Sector Performance Analytics */}
              <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                <h3 className="text-xl font-bold text-white mb-6">Sector Performance Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-4 text-slate-300 font-semibold">Sector</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Allocation</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">7 Days</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">30 Days</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">60 Days</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">90 Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorPerformanceData.map((sector, index) => (
                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 ${sector.color} rounded mr-3`}></div>
                              <span className="text-white font-medium">{sector.sector}</span>
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className="text-white font-semibold">{sector.allocation}</span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className={`font-semibold ${
                              sector.performance['7d'].startsWith('+') ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {sector.performance['7d']}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className={`font-semibold ${
                              sector.performance['30d'].startsWith('+') ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {sector.performance['30d']}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className={`font-semibold ${
                              sector.performance['60d'].startsWith('+') ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {sector.performance['60d']}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className={`font-semibold ${
                              sector.performance['90d'].startsWith('+') ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {sector.performance['90d']}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Best Performer</div>
                    <div className="text-lg font-bold text-green-400">Energy (+25.3%)</div>
                    <div className="text-sm text-slate-300">90-day performance</div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Most Stable</div>
                    <div className="text-lg font-bold text-blue-400">Healthcare (+12.6%)</div>
                    <div className="text-sm text-slate-300">Consistent growth</div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Risk Level</div>
                    <div className="text-lg font-bold text-yellow-400">Medium</div>
                    <div className="text-sm text-slate-300">Well diversified</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'watchlist' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Real-Time Watchlist</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Tracked Stocks</h3>
                  <div className="space-y-3">
                    {mockPortfolioData.map((stock, index) => (
                      <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">{stock.symbol}</div>
                            <div className="text-sm text-slate-400">Last updated: 2 min ago</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">${stock.price}</div>
                            <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stock.change >= 0 ? '+' : ''}${stock.change}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Price Alerts</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Bell className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="font-semibold text-blue-300">AAPL Alert</span>
                      </div>
                      <p className="text-sm text-blue-200">Price above $150 - Target reached!</p>
                    </div>
                    
                    <div className="bg-orange-900/30 border border-orange-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Eye className="w-5 h-5 text-orange-400 mr-2" />
                        <span className="font-semibold text-orange-300">TSLA Watch</span>
                      </div>
                      <p className="text-sm text-orange-200">Price approaching support level</p>
                    </div>
                    
                    <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                        <span className="font-semibold text-green-300">NVDA Breakout</span>
                      </div>
                      <p className="text-sm text-green-200">Breaking resistance at $480</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'alerts' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Smart Notifications</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
                  <div className="space-y-4">
                    <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-300">Price Alert Triggered</span>
                        <span className="text-sm text-slate-400">2 min ago</span>
                      </div>
                      <p className="text-sm text-green-200">AAPL reached $150.25 (+1.45%)</p>
                    </div>
                    
                    <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-300">News Alert</span>
                        <span className="text-sm text-slate-400">5 min ago</span>
                      </div>
                      <p className="text-sm text-blue-200">Apple announces new product launch</p>
                    </div>
                    
                    <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-300">AI Recommendation</span>
                        <span className="text-sm text-slate-400">10 min ago</span>
                      </div>
                      <p className="text-sm text-purple-200">Consider adding NVDA to portfolio</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Alert Settings</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Price Alerts</span>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Get notified when stocks hit target prices</p>
                    </div>
                    
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">News Alerts</span>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Stay updated with relevant news</p>
                    </div>
                    
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">AI Recommendations</span>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">Receive AI-powered investment suggestions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Experience the Full Power of AiCapital?
          </h3>
          <p className="text-lg text-slate-300 mb-6">
            Start your free trial today and see how AI can transform your investment strategy
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
