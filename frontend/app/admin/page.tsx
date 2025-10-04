'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { Users, TrendingUp, DollarSign, Activity, Eye, Power, RotateCcw } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  subscriptionActive: boolean;
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
    dangerous: number;
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
    } catch (error: unknown) {
      console.error('Error fetching admin data:', error);

      if (error instanceof AxiosError && error.response?.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'reset') => {
    try {
      let endpoint = '';
      switch (action) {
        case 'activate':
          endpoint = `/api/admin/users/${userId}/activate`;
          break;
        case 'deactivate':
          endpoint = `/api/admin/users/${userId}/deactivate`;
          break;
        case 'reset':
          endpoint = `/api/admin/users/${userId}/portfolio`;
          break;
      }

      await axios[action === 'reset' ? 'delete' : 'put'](
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );

      fetchData();
    } catch (error: unknown) {
      console.error(`Error ${action} user:`, error);
      alert(`Error ${action}ing user`);
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
    } catch (error: unknown) {
      console.error('Error fetching user portfolio:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const formatPercent = (percent: number) =>
    `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

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
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">AiCapital Admin</h1>
              <span className="ml-2 px-2 py-1 bg-danger-600 text-xs rounded-full">ADMIN</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.users.total}</p>
              </div>
              <Users className="w-6 h-6 text-white bg-primary-600 rounded-lg p-1" />
            </div>
            <div className="card p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.users.active}</p>
              </div>
              <Activity className="w-6 h-6 text-white bg-success-600 rounded-lg p-1" />
            </div>
            <div className="card p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Total Capital</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.capital.totalCapital)}</p>
              </div>
              <DollarSign className="w-6 h-6 text-white bg-warning-600 rounded-lg p-1" />
            </div>
            <div className="card p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Portfolios</p>
                <p className="text-2xl font-bold text-white">{stats.portfolios.total}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-white bg-primary-600 rounded-lg p-1" />
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-sm text-white">
                      <div>{user.name}</div>
                      <div className="text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${user.subscriptionActive ? 'bg-success-900 text-success-400' : 'bg-gray-700 text-gray-400'}`}>
                        {user.subscriptionActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{user.portfolioType || 'None'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={user.portfolioStats.totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'}>
                        {formatCurrency(user.portfolioStats.totalPnL)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => viewUserPortfolio(user.id)} className="text-primary-400 hover:text-primary-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm flex space-x-2">
                      <button
                        onClick={() => handleUserAction(user.id, user.subscriptionActive ? 'deactivate' : 'activate')}
                        className={user.subscriptionActive ? 'text-danger-400' : 'text-success-400'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleUserAction(user.id, 'reset')} className="text-warning-400">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
