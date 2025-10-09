'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Users, TrendingUp, DollarSign, Activity, Eye, Power, RotateCcw, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  subscriptionActive: boolean;
  subscriptionTier: 'free' | 'premium';
  onboardingCompleted: boolean;
  portfolioType?: string;
  portfolioSource?: string;
  totalCapital?: number;
  riskTolerance?: number;
  createdAt: string;
  portfolioStats: {
    totalCost: number;
    totalValue: number;
    totalPnL: number;
    pnlPercent: number;
    stockCount: number;
    actionCounts: Record<string, number>;
  };
}

interface SystemStats {
  users: {
    total: number;
    active: number;
    completedOnboarding: number;
  };
  portfolios: {
    total: number;
    solid: number;
    risky: number;
  };
  actions: Array<{ _id: string; count: number }>;
  capital: {
    totalCapital: number;
    avgCapital: number;
  };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPortfolio, setUserPortfolio] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        })
      ]);

      setUsers(usersResponse.data.users);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      const err = error as any; // ✅ תיקון טיפוס
      if (err?.response?.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'reset' | 'make-premium' | 'make-free' | 'refresh') => {
    try {
      let endpoint = '';
      let method: 'put' | 'delete' | 'post' = 'put';
      
      switch (action) {
        case 'activate':
          endpoint = `/api/admin/users/${userId}/activate`;
          break;
        case 'deactivate':
          endpoint = `/api/admin/users/${userId}/deactivate`;
          break;
        case 'reset':
          endpoint = `/api/admin/users/${userId}/portfolio`;
          method = 'delete';
          break;
        case 'make-premium':
          endpoint = `/api/admin/users/${userId}/make-premium`;
          break;
        case 'make-free':
          endpoint = `/api/admin/users/${userId}/make-free`;
          break;
        case 'refresh':
          endpoint = `/api/admin/users/${userId}/refresh`;
          method = 'post';
          break;
      }

      const response = await axios[method](
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );

      if (action === 'refresh') {
        // Update the specific user's data in the state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, ...response.data.user }
              : user
          )
        );
        alert(`✅ ${response.data.message}`);
      } else {
        alert(`✅ User ${action} successful!`);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      const err = error as any;
      alert(`❌ Error ${action}ing user: ${err?.response?.data?.message || 'Unknown error'}`);
    }
  };

  const viewUserPortfolio = async (userId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/portfolio`,
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );
      
      setSelectedUser(response.data.user);
      setUserPortfolio(response.data.portfolio);
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white">AiCapital Admin</h1>
              <span className="ml-2 px-3 py-1 bg-danger-600 text-sm rounded-full">ADMIN</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors text-base sm:text-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.users.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats.users.active}</p>
                </div>
                <div className="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Capital</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.capital.totalCapital)}</p>
                </div>
                <div className="w-12 h-12 bg-warning-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Portfolios</p>
                  <p className="text-2xl font-bold text-white">{stats.portfolios.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">All Users</h2>
            <button
              onClick={async () => {
                try {
                  const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-all-prices`,
                    {},
                    { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                  );
                  alert(`✅ ${response.data.message}`);
                  fetchData(); // Refresh all data
                } catch (error) {
                  console.error('Error updating all prices:', error);
                  alert('❌ Error updating all prices. Please try again.');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Update All Prices</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">View</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        user.subscriptionTier === 'premium' 
                          ? 'text-emerald-300 bg-emerald-900/50 border border-emerald-500/30' 
                          : 'text-amber-300 bg-amber-900/50 border border-amber-500/30'
                      }`}>
                        {user.subscriptionTier === 'premium' ? '⭐ PREMIUM' : '🔒 FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.subscriptionActive ? 'text-success-400 bg-success-900' : 'text-gray-400 bg-gray-700'
                        }`}>
                          {user.subscriptionActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.onboardingCompleted ? 'text-primary-400 bg-primary-900' : 'text-warning-400 bg-warning-900'
                        }`}>
                          {user.onboardingCompleted ? 'Onboarded' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        <div>{user.portfolioType || 'None'}</div>
                        <div className="text-xs text-gray-400">
                          {user.portfolioStats.stockCount} stocks
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          user.portfolioStats.totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'
                        }`}>
                          {formatCurrency(user.portfolioStats.totalPnL)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatPercent(user.portfolioStats.pnlPercent)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => viewUserPortfolio(user.id)}
                        className="text-primary-400 hover:text-primary-300"
                        title="View Portfolio"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        {/* Premium/Free Toggle */}
                        <button
                          onClick={() => handleUserAction(user.id, user.subscriptionTier === 'premium' ? 'make-free' : 'make-premium')}
                          className={`px-3 py-1 text-xs font-semibold rounded ${
                            user.subscriptionTier === 'premium' 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title={user.subscriptionTier === 'premium' ? 'Downgrade to Free' : 'Upgrade to Premium'}
                        >
                          {user.subscriptionTier === 'premium' ? '⬇️ Make Free' : '⬆️ Make Premium'}
                        </button>
                        {/* Other Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserAction(user.id, user.subscriptionActive ? 'deactivate' : 'activate')}
                            className={`${
                              user.subscriptionActive ? 'text-danger-400 hover:text-danger-300' : 'text-success-400 hover:text-success-300'
                            }`}
                            title={user.subscriptionActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'refresh')}
                            className="text-blue-400 hover:text-blue-300"
                            title="Refresh Portfolio Data"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'reset')}
                            className="text-warning-400 hover:text-warning-300"
                            title="Reset Portfolio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Portfolio Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedUser.name}'s Portfolio
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Ticker</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Shares</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Entry</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Current</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">P&L</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {userPortfolio.map((item, index) => {
                      const cost = item.entryPrice * item.shares;
                      const value = item.currentPrice * item.shares;
                      const pnl = value - cost;
                      
                      return (
                        <tr key={index} className="table-row">
                          <td className="px-4 py-2 text-sm text-white">{item.ticker}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">{item.shares}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">{formatCurrency(item.entryPrice)}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">{formatCurrency(item.currentPrice)}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${
                            pnl >= 0 ? 'text-success-400' : 'text-danger-400'
                          }`}>
                            {formatCurrency(pnl)}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.action === 'BUY' ? 'text-success-400 bg-success-900' :
                              item.action === 'SELL' ? 'text-danger-400 bg-danger-900' :
                              'text-warning-400 bg-warning-900'
                            }`}>
                              {item.action}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
