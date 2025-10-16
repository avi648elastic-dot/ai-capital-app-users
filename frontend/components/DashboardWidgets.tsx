'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  BarChart3, 
  PieChart,
  Activity,
  DollarSign,
  Percent,
  Clock,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { useRealtimePrices } from '@/lib/realtimePriceService';

interface Widget {
  id: string;
  title: string;
  type: 'portfolio-summary' | 'price-ticker' | 'performance-chart' | 'risk-metrics' | 'market-overview' | 'quick-actions';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  config?: any;
}

interface DashboardWidgetsProps {
  portfolio: any[];
  onAddStock: () => void;
  onViewAnalytics: () => void;
  onViewRisk: () => void;
}

export default function DashboardWidgets({ 
  portfolio, 
  onAddStock, 
  onViewAnalytics, 
  onViewRisk 
}: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  
  // Get unique tickers for real-time updates
  const tickers = portfolio.map(item => item.ticker);
  const { prices, isConnected } = useRealtimePrices(tickers);

  // Initialize default widgets
  useEffect(() => {
    const defaultWidgets: Widget[] = [
      {
        id: 'portfolio-summary',
        title: 'Portfolio Summary',
        type: 'portfolio-summary',
        size: 'medium',
        position: { x: 0, y: 0 }
      },
      {
        id: 'price-ticker',
        title: 'Live Prices',
        type: 'price-ticker',
        size: 'large',
        position: { x: 0, y: 1 }
      },
      {
        id: 'performance-chart',
        title: 'Performance',
        type: 'performance-chart',
        size: 'large',
        position: { x: 1, y: 0 }
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        type: 'quick-actions',
        size: 'small',
        position: { x: 2, y: 0 }
      }
    ];
    
    setWidgets(defaultWidgets);
  }, []);

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggedWidget) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 200); // 200px per column
    const y = Math.floor((e.clientY - rect.top) / 150); // 150px per row
    
    setWidgets(prev => prev.map(widget => 
      widget.id === draggedWidget 
        ? { ...widget, position: { x, y } }
        : widget
    ));
    
    setDraggedWidget(null);
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-48 h-32';
      case 'medium': return 'w-96 h-48';
      case 'large': return 'w-full h-64';
      default: return 'w-96 h-48';
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'portfolio-summary':
        return <PortfolioSummaryWidget portfolio={portfolio} />;
      case 'price-ticker':
        return <PriceTickerWidget portfolio={portfolio} prices={prices} isConnected={isConnected} />;
      case 'performance-chart':
        return <PerformanceChartWidget portfolio={portfolio} />;
      case 'quick-actions':
        return <QuickActionsWidget onAddStock={onAddStock} onViewAnalytics={onViewAnalytics} onViewRisk={onViewRisk} />;
      default:
        return <div className="p-4 text-slate-400">Unknown widget type</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Dashboard Widgets</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDragEnd}
      >
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`
              ${getWidgetSize(widget.size)}
              bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all
              ${isEditing ? 'cursor-move' : ''}
              ${draggedWidget === widget.id ? 'opacity-50' : ''}
            `}
            draggable={isEditing}
            onDragStart={() => handleDragStart(widget.id)}
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
              {isEditing && (
                <button
                  onClick={() => toggleWidget(widget.id)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Widget Content */}
            <div className="p-4 h-full overflow-hidden">
              {renderWidget(widget)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual Widget Components
function PortfolioSummaryWidget({ portfolio }: { portfolio: any[] }) {
  const totals = portfolio.reduce((acc, item) => ({
    initial: acc.initial + item.shares * item.entryPrice,
    current: acc.current + item.shares * item.currentPrice,
    totalPnL: acc.totalPnL + (item.shares * (item.currentPrice - item.entryPrice)),
  }), { initial: 0, current: 0, totalPnL: 0 });

  const totalPnLPercent = totals.initial > 0 ? (totals.totalPnL / totals.initial) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Total Value</span>
        <span className="text-lg font-bold text-white">${totals.current.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">P&L</span>
        <span className={`text-sm font-semibold ${totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totals.totalPnL >= 0 ? '+' : ''}${totals.totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(1)}%)
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Positions</span>
        <span className="text-sm text-white">{portfolio.length}</span>
      </div>
    </div>
  );
}

function PriceTickerWidget({ portfolio, prices, isConnected }: { portfolio: any[]; prices: Map<string, any>; isConnected: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Live Prices</span>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {portfolio.slice(0, 5).map(item => {
          const livePrice = prices.get(item.ticker);
          const currentPrice = livePrice?.price || item.currentPrice;
          const change = livePrice?.change || (currentPrice - item.entryPrice);
          const changePercent = livePrice?.changePercent || ((currentPrice - item.entryPrice) / item.entryPrice) * 100;
          
          return (
            <div key={item._id} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{item.ticker}</span>
              <div className="text-right">
                <span className="text-white">${currentPrice.toFixed(2)}</span>
                <span className={`ml-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerformanceChartWidget({ portfolio }: { portfolio: any[] }) {
  // Simple performance visualization
  const performanceData = portfolio.map(item => ({
    ticker: item.ticker,
    pnl: item.shares * (item.currentPrice - item.entryPrice),
    pnlPercent: ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100
  }));

  const maxPnl = Math.max(...performanceData.map(d => Math.abs(d.pnl)));

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 mb-2">Top Performers</div>
      {performanceData
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 3)
        .map((item, index) => (
          <div key={item.ticker} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{item.ticker}</span>
              <span className={`${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div 
                className={`h-1 rounded-full ${item.pnl >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                style={{ width: `${Math.abs(item.pnl) / maxPnl * 100}%` }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

function QuickActionsWidget({ onAddStock, onViewAnalytics, onViewRisk }: { 
  onAddStock: () => void; 
  onViewAnalytics: () => void; 
  onViewRisk: () => void; 
}) {
  const actions = [
    { icon: Plus, label: 'Add Stock', onClick: onAddStock, color: 'text-blue-400' },
    { icon: BarChart3, label: 'Analytics', onClick: onViewAnalytics, color: 'text-green-400' },
    { icon: Shield, label: 'Risk', onClick: onViewRisk, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="flex items-center space-x-2 p-2 hover:bg-slate-700/50 rounded-lg transition-all active:scale-95"
        >
          <action.icon className={`w-4 h-4 ${action.color}`} />
          <span className="text-xs text-slate-300">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
