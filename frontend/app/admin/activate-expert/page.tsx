'use client';

import { useState } from 'react';

export default function ActivateExpertPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const activateExpert = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('https://ai-capital-app7.onrender.com/api/admin-setup/set-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'avi648elastic@gmail.com',
          secretKey: 'change-this-secret-key-in-production'
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('🎉 SUCCESS! Your account is now the Expert Trader!\n\nRefresh the page and click "Expert Portfolio".');
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 max-w-md w-full border border-slate-700/50">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          🎓 Activate Expert Portfolio
        </h1>
        
        <p className="text-slate-300 mb-6 text-center">
          This will designate your account as the Expert Trader whose portfolio will be visible to all users.
        </p>
        
        <button
          onClick={activateExpert}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Activating...' : '🚀 Activate Expert Portfolio'}
        </button>
        
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-xs text-slate-400 text-center">
          <p>After activation:</p>
          <p>1. Refresh the main page</p>
          <p>2. Click "Expert Portfolio" in the sidebar</p>
          <p>3. Add some stocks to your portfolio to see them here</p>
        </div>
      </div>
    </div>
  );
}
