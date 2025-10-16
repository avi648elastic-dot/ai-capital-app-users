'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
  Shield,
  BarChart3
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'optimization' | 'trend' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  ticker?: string;
  confidence: number;
  potentialImpact: {
    value: number;
    percentage: number;
  };
  actionItems: string[];
  relatedMetrics: {
    [key: string]: number;
  };
  timestamp: string;
}

interface PortfolioAnalysis {
  overallScore: number;
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  insights: AIInsight[];
  recommendations: string[];
  predictedPerformance: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
  cached?: boolean;
}

export default function AIInsightsPanel() {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const token = Cookies.get('token');

      const response = await axios.get(`${apiUrl}/api/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalysis(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching AI insights:', err);
      setError(err.response?.data?.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    try {
      setRefreshing(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const token = Cookies.get('token');

      const response = await axios.post(`${apiUrl}/api/ai-insights/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalysis(response.data);
      }
    } catch (err: any) {
      console.error('Error refreshing insights:', err);
      setError(err.response?.data?.message || 'Failed to refresh insights');
    } finally {
      setRefreshing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'optimization': return Lightbulb;
      case 'trend': return BarChart3;
      case 'risk': return Shield;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string, severity: string) => {
    if (type === 'opportunity') return 'from-green-500 to-emerald-500';
    if (severity === 'critical') return 'from-red-500 to-rose-500';
    if (severity === 'high') return 'from-orange-500 to-amber-500';
    if (severity === 'medium') return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="text-slate-300">Analyzing your portfolio with AI...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 border border-red-500/30">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load AI Insights</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Portfolio Insights</h2>
            <p className="text-sm text-slate-400">
              Powered by advanced analytics {analysis.cached && '• Cached'}
            </p>
          </div>
        </div>

        <button
          onClick={refreshInsights}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-slate-400 text-sm mb-2">Overall Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}/100
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-slate-400 text-sm mb-2">Diversification</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.diversificationScore)}`}>
            {analysis.diversificationScore}/100
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-slate-400 text-sm mb-2">Risk Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.riskScore)}`}>
            {analysis.riskScore}/100
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-slate-400 text-sm mb-2">Performance</div>
          <div className={`text-3xl font-bold ${getScoreColor(analysis.performanceScore)}`}>
            {analysis.performanceScore}/100
          </div>
        </div>
      </div>

      {/* Predicted Performance */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Performance Prediction</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">Next Week</div>
            <div className={`text-xl font-bold ${analysis.predictedPerformance.nextWeek >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analysis.predictedPerformance.nextWeek >= 0 ? '+' : ''}{analysis.predictedPerformance.nextWeek.toFixed(1)}%
            </div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">Next Month</div>
            <div className={`text-xl font-bold ${analysis.predictedPerformance.nextMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analysis.predictedPerformance.nextMonth >= 0 ? '+' : ''}{analysis.predictedPerformance.nextMonth.toFixed(1)}%
            </div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">Next Quarter</div>
            <div className={`text-xl font-bold ${analysis.predictedPerformance.nextQuarter >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analysis.predictedPerformance.nextQuarter >= 0 ? '+' : ''}{analysis.predictedPerformance.nextQuarter.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          AI Insights ({analysis.insights.length})
        </h3>

        <div className="space-y-3">
          {analysis.insights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            
            return (
              <div
                key={insight.id}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer"
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getInsightColor(insight.type, insight.severity)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-white font-semibold">{insight.title}</h4>
                        {getSeverityBadge(insight.severity)}
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{insight.description}</p>
                      <p className="text-slate-400 text-sm italic">{insight.recommendation}</p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                    {insight.ticker && <span>Ticker: {insight.ticker}</span>}
                  </div>
                  
                  <div className={`text-sm font-semibold ${
                    insight.potentialImpact.percentage >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Impact: {insight.potentialImpact.percentage >= 0 ? '+' : ''}{insight.potentialImpact.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Top Recommendations</h3>
        </div>

        <div className="space-y-2">
          {analysis.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-slate-300 text-sm flex-1">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = getInsightIcon(selectedInsight.type);
                    return (
                      <div className={`w-12 h-12 bg-gradient-to-r ${getInsightColor(selectedInsight.type, selectedInsight.severity)} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                    {getSeverityBadge(selectedInsight.severity)}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Description</h4>
                  <p className="text-slate-300">{selectedInsight.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Recommendation</h4>
                  <p className="text-slate-300">{selectedInsight.recommendation}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Action Items</h4>
                  <ul className="space-y-2">
                    {selectedInsight.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Confidence</div>
                    <div className="text-lg font-bold text-white">
                      {(selectedInsight.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Potential Impact</div>
                    <div className={`text-lg font-bold ${
                      selectedInsight.potentialImpact.percentage >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedInsight.potentialImpact.percentage >= 0 ? '+' : ''}
                      {selectedInsight.potentialImpact.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {Object.keys(selectedInsight.relatedMetrics).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Related Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedInsight.relatedMetrics).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
