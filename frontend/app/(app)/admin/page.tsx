'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Users, TrendingUp, DollarSign, Activity, Eye, Power, RotateCcw, Trash2, Shield, Crown } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  subscriptionActive: boolean;
  subscriptionTier: 'free' | 'premium' | 'premium+';
  isAdmin?: boolean;
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
  const [activeTab, setActiveTab] = useState<'users' | 'notifications'>('users');
  
  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    category: 'system' as const,
    userId: '',
    channels: {
      dashboard: true,
      popup: true,
      email: false
    }
  });
  
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, statsResponse, notificationsResponse, notificationStatsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` },
          params: { limit: 50 }
        }).catch(() => ({ data: { data: { notifications: [] } } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stats`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        }).catch(() => ({ data: { data: null } }))
      ]);

      setUsers(usersResponse.data.users);
      setStats(statsResponse.data);
      setNotifications(notificationsResponse.data.data.notifications || []);
      setNotificationStats(notificationStatsResponse.data.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      const err = error as any;
      if (err?.response?.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'reset' | 'make-premium' | 'make-premium+' | 'make-free' | 'make-admin' | 'remove-admin' | 'refresh') => {
    try {
      let endpoint = '';
      let method: 'put' | 'delete' | 'post' = 'put';
      let body: any = {};
      
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
          endpoint = `/api/admin/users/${userId}/promote`;
          body = { subscriptionTier: 'premium' };
          break;
        case 'make-premium+':
          endpoint = `/api/admin/users/${userId}/promote`;
          body = { subscriptionTier: 'premium+' };
          break;
        case 'make-free':
          endpoint = `/api/admin/users/${userId}/promote`;
          body = { subscriptionTier: 'free' };
          break;
        case 'make-admin':
          endpoint = `/api/admin/users/${userId}/promote`;
          body = { isAdmin: true };
          break;
        case 'remove-admin':
          endpoint = `/api/admin/users/${userId}/promote`;
          body = { isAdmin: false };
          break;
        case 'refresh':
          endpoint = `/api/admin/users/${userId}/refresh`;
          method = 'post';
          break;
      }

      const response = await axios[method](
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        Object.keys(body).length > 0 ? body : {},
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );

      if (action === 'refresh' || action.includes('promote')) {
        // Update the specific user's data in the state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, ...response.data.user }
              : user
          )
        );
        alert(`✅ ${response.data.message || 'User updated successfully!'}`);
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

  // Notification functions
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = Cookies.get('token');
      const payload = {
        ...newNotification,
        userId: newNotification.userId || undefined
      };

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateForm(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        category: 'system',
        userId: '',
        channels: {
          dashboard: true,
          popup: true,
          email: false
        }
      });
      fetchData();
      alert('Notification created successfully!');
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to create notification');
    }
  };

  const handleCreateGlobal = async () => {
    try {
      const token = Cookies.get('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/global`, {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateForm(false);
      fetchData();
      alert('Global notification created successfully!');
    } catch (error) {
      console.error('Error creating global notification:', error);
      alert('Failed to create global notification');
    }
  };

  const handleCleanupInvalidNotifications = async () => {
    if (!confirm('This will delete all BUY and HOLD portfolio notifications. Only SELL notifications will remain. Continue?')) {
      return;
    }

    try {
      const token = Cookies.get('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/cleanup-invalid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchData();
      alert(response.data.message);
    } catch (error) {
      console.error('Error cleaning up invalid notifications:', error);
      alert('Failed to cleanup invalid notifications');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'action': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Activity className="w-5 h-5 inline mr-2" />
                Notifications
              </button>
            </nav>
          </div>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
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
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.subscriptionTier === 'premium+' 
                            ? 'text-purple-300 bg-purple-900/50 border border-purple-500/30' 
                            : user.subscriptionTier === 'premium'
                            ? 'text-emerald-300 bg-emerald-900/50 border border-emerald-500/30' 
                            : 'text-amber-300 bg-amber-900/50 border border-amber-500/30'
                        }`}>
                          {user.subscriptionTier === 'premium+' ? '💎 PREMIUM+' : 
                           user.subscriptionTier === 'premium' ? '⭐ PREMIUM' : '🔒 FREE'}
                        </span>
                        {user.isAdmin && (
                          <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full text-red-300 bg-red-900/50 border border-red-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            ADMIN
                          </span>
                        )}
                      </div>
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
                        {/* Subscription Tier Actions */}
                        <div className="flex flex-wrap gap-1">
                          {user.subscriptionTier !== 'free' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'make-free')}
                              className="px-2 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white"
                              title="Downgrade to Free"
                            >
                              Free
                            </button>
                          )}
                          {user.subscriptionTier !== 'premium' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'make-premium')}
                              className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Upgrade to Premium"
                            >
                              Premium
                            </button>
                          )}
                          {user.subscriptionTier !== 'premium+' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'make-premium+')}
                              className="px-2 py-1 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-700 text-white"
                              title="Upgrade to Premium+"
                            >
                              Premium+
                            </button>
                          )}
                        </div>
                        
                        {/* Admin Actions */}
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleUserAction(user.id, user.isAdmin ? 'remove-admin' : 'make-admin')}
                            className={`px-2 py-1 text-xs font-semibold rounded flex items-center space-x-1 ${
                              user.isAdmin 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title={user.isAdmin ? 'Remove Admin Access' : 'Make Admin'}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{user.isAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                          </button>
                        </div>
                        
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
          </>
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <>
            {/* Notification Stats */}
            {notificationStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Notifications</p>
                      <p className="text-2xl font-bold text-white">{notificationStats.total || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Unread</p>
                      <p className="text-2xl font-bold text-white">{notificationStats.unread || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🔔</span>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Action Notifications</p>
                      <p className="text-2xl font-bold text-white">{notificationStats.byType?.action || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">📈</span>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Recent Activity</p>
                      <p className="text-2xl font-bold text-white">{notificationStats.recentActivity || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">⚡</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
              >
                + Create Notification
              </button>
              <button
                onClick={() => fetchData()}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleCleanupInvalidNotifications}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                🧹 Clean Invalid
              </button>
            </div>

            {/* Notifications List */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Recent Notifications</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {notifications.map((notification) => (
                      <tr key={notification._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-400 max-w-xs truncate">{notification.message}</div>
                          {notification.actionData && (
                            <div className="text-xs text-purple-400 mt-1">
                              {notification.actionData.ticker} - {notification.actionData.action}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {notification.userId ? (
                            <span className="font-mono text-xs">{notification.userId.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-green-400">Global</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            notification.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            notification.status === 'read' ? 'bg-blue-100 text-blue-800' :
                            notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Create Notification Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Notification</h2>
              
              <form onSubmit={handleCreateNotification} className="space-y-6">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                      <option value="action">Action</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Priority</label>
                    <select
                      value={newNotification.priority}
                      onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">User ID (leave empty for global)</label>
                  <input
                    type="text"
                    value={newNotification.userId}
                    onChange={(e) => setNewNotification({ ...newNotification, userId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter user ID or leave empty for global notification"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Create for User
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGlobal}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
