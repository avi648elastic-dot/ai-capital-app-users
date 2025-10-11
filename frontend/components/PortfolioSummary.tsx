interface PortfolioTotals {
  initial: number;
  current: number;
  totalPnL: number;
  totalPnLPercent: number;
}

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
}

export default function PortfolioSummary({ totals }: PortfolioSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-5 portfolio-summary">
      {/* Initial Investment */}
      <div className="financial-metric group hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 [data-theme='light']:text-gray-600 mb-1">Initial</p>
            <p className="text-base sm:text-lg font-bold text-slate-100 [data-theme='light']:text-gray-900">
              {formatCurrency(totals.initial)}
            </p>
          </div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Current Value */}
      <div className="financial-metric group hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 [data-theme='light']:text-gray-600 mb-1">Current</p>
            <p className="text-base sm:text-lg font-bold text-slate-100 [data-theme='light']:text-gray-900">
              {formatCurrency(totals.current)}
            </p>
          </div>
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total P&L */}
      <div className="financial-metric group hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 [data-theme='light']:text-gray-600 mb-1">P&L</p>
            <p className={`text-base sm:text-lg font-bold ${
              totals.totalPnL >= 0 ? 'text-emerald-400 [data-theme="light"]:text-emerald-600' : 'text-red-400 [data-theme="light"]:text-red-600'
            }`}>
              {formatCurrency(totals.totalPnL)}
            </p>
          </div>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ${
            totals.totalPnL >= 0 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        </div>
      </div>

      {/* P&L Percentage */}
      <div className="financial-metric group hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 [data-theme='light']:text-gray-600 mb-1">ROI</p>
            <p className={`text-base sm:text-lg font-bold ${
              totals.totalPnLPercent >= 0 ? 'text-emerald-400 [data-theme="light"]:text-emerald-600' : 'text-red-400 [data-theme="light"]:text-red-600'
            }`}>
              {formatPercent(totals.totalPnLPercent)}
            </p>
          </div>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ${
            totals.totalPnLPercent >= 0 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
