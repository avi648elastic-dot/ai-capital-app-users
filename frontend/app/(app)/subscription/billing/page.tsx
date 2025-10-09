'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CreditCard, Calendar, Download, AlertCircle } from 'lucide-react';

export default function Billing() {
  const [user, setUser] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setUser(response.data.user);
      
      // Mock billing history
      setBillingHistory([
        {
          id: 1,
          date: '2024-01-15',
          amount: 29.00,
          status: 'paid',
          description: 'Premium Subscription - January 2024',
          invoiceId: 'INV-2024-001'
        },
        {
          id: 2,
          date: '2023-12-15',
          amount: 29.00,
          status: 'paid',
          description: 'Premium Subscription - December 2023',
          invoiceId: 'INV-2023-012'
        },
        {
          id: 3,
          date: '2023-11-15',
          amount: 29.00,
          status: 'paid',
          description: 'Premium Subscription - November 2023',
          invoiceId: 'INV-2023-011'
        }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoiceId: string) => {
    // TODO: implement invoice download
    alert(`Downloading invoice ${invoiceId}...`);
  };

  const updatePaymentMethod = () => {
    // TODO: implement payment method update
    alert('Payment method update coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Invoices</h1>
          <p className="text-slate-400">Manage your subscription and billing information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Current Plan
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {user?.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                  </div>
                  <div className="text-slate-400">
                    {user?.subscriptionTier === 'premium' ? '$29/month' : 'No cost'}
                  </div>
                </div>
                {user?.subscriptionTier === 'premium' && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400">Next billing date</div>
                    <div className="text-white">February 15, 2024</div>
                  </div>
                )}
                <div className="pt-4">
                  {user?.subscriptionTier === 'free' ? (
                    <button className="btn-primary w-full">
                      Upgrade to Premium
                    </button>
                  ) : (
                    <button
                      onClick={updatePaymentMethod}
                      className="btn-secondary w-full"
                    >
                      Update Payment Method
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Billing History
              </h3>
              {user?.subscriptionTier === 'free' ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No billing history for free accounts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{invoice.description}</div>
                          <div className="text-sm text-slate-400">{invoice.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-medium">${invoice.amount.toFixed(2)}</div>
                          <div className={`text-sm ${
                            invoice.status === 'paid' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadInvoice(invoice.invoiceId)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Download invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        {user?.subscriptionTier === 'premium' && (
          <div className="mt-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-white">•••• •••• •••• 4242</div>
                    <div className="text-sm text-slate-400">Expires 12/25</div>
                  </div>
                </div>
                <button
                  onClick={updatePaymentMethod}
                  className="btn-secondary"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
