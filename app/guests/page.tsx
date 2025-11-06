'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Guest {
  id: string;
  userName: string;
  enable: boolean;
  expirationTime: number;
  siteId: string;
  status: 'active' | 'expired';
  isExpired: boolean;
  portals: string[];
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [userTimezone, setUserTimezone] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Update document class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Detect user's timezone
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
  }, []);

  const fetchGuests = async () => {
    try {
      setError('');
      const response = await fetch('/api/guests');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch guests');
      }

      // Sort by expiration time (soonest first), then by room number
      const sortedGuests = data.guests.sort((a: Guest, b: Guest) => {
        if (a.expirationTime === 0) return 1; // No expiration goes to end
        if (b.expirationTime === 0) return -1;
        return a.expirationTime - b.expirationTime;
      });

      setGuests(sortedGuests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGuests();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDateTime = (timestamp: number) => {
    if (timestamp === 0) {
      return 'No expiration';
    }

    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeRemaining = (timestamp: number) => {
    if (timestamp === 0) return null;

    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }

    return `${minutes}m remaining`;
  };

  const activeGuests = guests.filter(g => !g.isExpired);
  const expiredGuests = guests.filter(g => g.isExpired);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a2332] dark:to-[#25363F] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-3 bg-white dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#3d4a5f] transition-all shadow-md"
              >
                <svg className="w-5 h-5 text-[#333c50] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>

              <div>
                <h1 className="text-4xl font-bold text-[#333c50] dark:text-white">Guest List</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View all WiFi guests • Times shown in <strong className="text-[#f7a83c]">{userTimezone}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  autoRefresh
                    ? 'bg-[#f7a83c] text-white'
                    : 'bg-white dark:bg-[#333c50] text-[#333c50] dark:text-white border border-gray-200 dark:border-gray-600'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 bg-white dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#3d4a5f] transition-all shadow-md"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-[#f7a83c]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#333c50]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Refresh button */}
              <button
                onClick={fetchGuests}
                disabled={loading}
                className="p-3 bg-[#f7a83c] hover:bg-[#e89729] rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <svg className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#333c50] rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#333c50] dark:text-white">{activeGuests.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Guests</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#333c50] rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#333c50] dark:text-white">{expiredGuests.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expired Guests</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#333c50] rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#f7a83c]/20 rounded-lg">
                  <svg className="w-6 h-6 text-[#f7a83c]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#333c50] dark:text-white">{guests.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Guests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f7a83c]"></div>
          </div>
        )}

        {/* Guests table */}
        {!loading && guests.length === 0 && (
          <div className="bg-white dark:bg-[#333c50] rounded-xl p-12 text-center border border-gray-200 dark:border-gray-600 shadow-md">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-bold text-[#333c50] dark:text-white mb-2">No guests found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first WiFi guest to get started</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#f7a83c] hover:bg-[#e89729] text-white font-semibold rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Guest</span>
            </Link>
          </div>
        )}

        {!loading && guests.length > 0 && (
          <div className="bg-white dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#25363F] border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#333c50] dark:text-white uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#333c50] dark:text-white uppercase tracking-wider">
                      Checkout Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#333c50] dark:text-white uppercase tracking-wider">
                      Time Remaining
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#333c50] dark:text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#333c50] dark:text-white uppercase tracking-wider">
                      Enabled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50 dark:hover:bg-[#2d3f4a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-[#f7a83c]/20 rounded-lg">
                            <svg className="w-5 h-5 text-[#f7a83c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <span className="text-lg font-bold font-mono text-[#333c50] dark:text-white">{guest.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#333c50] dark:text-white font-medium">
                          {formatDateTime(guest.expirationTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          guest.isExpired
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {getTimeRemaining(guest.expirationTime) || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {guest.isExpired ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {guest.enable ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
