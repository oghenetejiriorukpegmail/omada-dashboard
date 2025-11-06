'use client';

import { useState, useEffect } from 'react';

interface Portal {
  id: string;
  name: string;
  enable: boolean;
  ssidList: string[];
  networkList: string[];
  authType: number;
  hotspotTypes: number[];
}

interface Site {
  siteId: string;
  name: string;
  region?: string;
  scenario?: string;
}

export default function UserCreationForm() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [portals, setPortals] = useState<Portal[]>([]);
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingSites, setFetchingSites] = useState(true);
  const [fetchingPortals, setFetchingPortals] = useState(false);
  const [needsSiteSelection, setNeedsSiteSelection] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userTimezone, setUserTimezone] = useState('');

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else {
      // Default to system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Update localStorage and document class when dark mode changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
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

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSite = localStorage.getItem('selectedSite');
    const savedPortals = localStorage.getItem('selectedPortals');

    if (savedSite) {
      setSelectedSite(savedSite);
    }
    if (savedPortals) {
      try {
        const parsed = JSON.parse(savedPortals);
        if (Array.isArray(parsed)) {
          setSelectedPortals(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved portals:', e);
      }
    }
  }, []);

  useEffect(() => {
    checkAndFetchData();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchPortals(selectedSite);
    }
  }, [selectedSite]);

  // Auto-select portal if only one is available
  useEffect(() => {
    if (portals.length === 1 && selectedPortals.length === 0) {
      setSelectedPortals([portals[0].id]);
    }
  }, [portals, selectedPortals.length]);

  const checkAndFetchData = async () => {
    setFetchingSites(true);
    setError('');
    try {
      const portalsResponse = await fetch('/api/portals');
      const portalsData = await portalsResponse.json();

      if (portalsResponse.ok) {
        const enabledPortals = portalsData.portals.filter((p: Portal) => p.enable);
        setPortals(enabledPortals);
        setNeedsSiteSelection(false);

        if (enabledPortals.length === 0) {
          setError('No enabled portals found. Please configure portals in Omada first.');
        }
      } else {
        const sitesResponse = await fetch('/api/sites');
        const sitesData = await sitesResponse.json();

        if (!sitesResponse.ok) {
          throw new Error(sitesData.error || 'Failed to fetch sites');
        }

        setSites(sitesData.sites);
        setNeedsSiteSelection(true);

        if (sitesData.sites.length === 0) {
          setError('No sites found. Please create a site in Omada first.');
        } else if (sitesData.sites.length === 1) {
          setSelectedSite(sitesData.sites[0].siteId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setFetchingSites(false);
    }
  };

  const fetchPortals = async (siteId: string) => {
    setFetchingPortals(true);
    setError('');
    try {
      const response = await fetch(`/api/portals?siteId=${siteId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portals');
      }

      const enabledPortals = data.portals.filter((p: Portal) => p.enable);
      setPortals(enabledPortals);

      if (enabledPortals.length === 0) {
        setError('No enabled portals found for this site. Please configure portals in Omada first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portals');
    } finally {
      setFetchingPortals(false);
    }
  };

  const handlePortalToggle = (portalId: string) => {
    setSelectedPortals((prev) =>
      prev.includes(portalId)
        ? prev.filter((id) => id !== portalId)
        : [...prev, portalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Room number and guest last name are required');
      setLoading(false);
      return;
    }

    if (username.length < 1 || username.length > 32) {
      setError('Please enter a room number');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Room number can only contain letters, numbers, hyphens, and underscores');
      setLoading(false);
      return;
    }

    if (password.length < 3) {
      setError('Guest last name must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (selectedPortals.length === 0) {
      setError('Please select at least one portal');
      setLoading(false);
      return;
    }

    try {
      // Convert local datetime to ISO string with timezone info
      let checkoutISO: string | undefined = undefined;
      if (checkoutDate) {
        // datetime-local format is "YYYY-MM-DDTHH:mm"
        // Explicitly parse as local time by appending seconds
        // This ensures the browser treats it as local time, not UTC
        const localDateString = checkoutDate.includes(':')
          ? `${checkoutDate}:00`  // Add seconds if not present
          : checkoutDate;

        // Create Date object - browser interprets as local time
        const localDate = new Date(localDateString);

        // Convert to ISO string (UTC) - e.g., "2025-11-06T13:03:00.000Z"
        checkoutISO = localDate.toISOString();
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username,
          password,
          portals: selectedPortals,
          siteId: needsSiteSelection ? selectedSite : undefined,
          checkoutDate: checkoutISO,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`WiFi access created for Room ${username} successfully!`);
      setUsername('');
      setPassword('');
      setCheckoutDate('');
      setSelectedPortals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Moby Logo - Top Center */}
      <div className="flex justify-center mb-6">
        <svg className="w-32 h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.93 75.17">
          <defs>
            <style>{`.l,.m{fill:#f7a83c;}.n{fill:#707070;}.m{fill-rule:evenodd;}.o{fill:#333c50;}`}</style>
          </defs>
          <g>
            <path className="o" d="M44.11,50.65c-.04-2.18,.73-4.29,2.16-5.93,2.37-2.93,6.67-3.38,9.59-1.01h0c.37,.3,.7,.64,1,1.01,2.88,3.44,2.88,8.45,0,11.89-2.42,2.92-6.74,3.32-9.66,.9h-.01c-.32-.28-.62-.58-.89-.9-1.45-1.66-2.22-3.8-2.16-6m-5,0c-.09,3.54,1.23,6.97,3.67,9.53,4.37,4.82,11.83,5.18,16.65,.81,.28-.26,.55-.53,.81-.81,4.89-5.39,4.89-13.61,0-19-4.33-4.82-11.74-5.22-16.57-.9-.31,.28-.61,.59-.89,.9-2.45,2.56-3.79,5.98-3.71,9.52"/>
            <path className="o" d="M72.79,50.7c-.05-2.2,.72-4.34,2.16-6,2.37-2.93,6.67-3.38,9.59-1.01h0c.37,.3,.7,.64,1,1.01,2.88,3.44,2.88,8.45,0,11.89-2.43,2.91-6.75,3.31-9.67,.89-.32-.27-.62-.57-.89-.89-1.43-1.63-2.2-3.74-2.16-5.91m-5,0v13.37h5v-2.68c4.84,3.99,11.96,3.46,16.17-1.19,4.88-5.39,4.88-13.61,0-19-4.19-4.68-11.33-5.22-16.17-1.22v-13.62h-5v24.34Z"/>
            <path className="n" d="M4.96,61.57v-20.29l9.62,21.33,.7,1.44h3.17l.7-1.44,9.57-21.33v22.77h5V27.34h-4.11l-.69,1.49-12.05,26.73L4.76,28.77l-.65-1.43H0v36.71H5l-.04-2.48Z"/>
            <path className="o" d="M4.96,61.57v-20.29l9.62,21.33,.7,1.44h3.17l.7-1.44,9.57-21.33v22.77h5V27.34h-4.11l-.69,1.49-12.05,26.73L4.76,28.77l-.65-1.43H0v36.71H5l-.04-2.48Z"/>
            <path className="o" d="M106.95,56.67l-6.15-17.92-.69-1.59h-5.31l1.31,3.38,7.42,22.92c-.62,1.85-1.49,3.61-2.58,5.23-.77,.98-1.97,1.53-3.22,1.47h-2.48v5h2.48c2.22,.11,4.4-.66,6.07-2.14,1.54-1.42,3.08-4.33,4.74-8.68l9.1-23.77,1.29-3.37h-5.31l-.64,1.59-6.03,17.88Z"/>
            <path className="l" d="M80.11,46.64c-2.21,0-4,1.79-4,4,0,2.21,1.79,4,4,4s4-1.79,4-4v-.05h0c-.03-2.19-1.81-3.95-4-3.95"/>
            <path className="o" d="M114.22,60.75h-1.49v.44h1v2.79h.44v-2.79h1v-.44h-.95Z"/>
            <path className="o" d="M115.96,63.76v-1.78l.85,1.85,.06,.12h.24l.06-.12,.85-1.88v2h.44v-3.2h-.35l-.07,.13-1.06,2.36-1.06-2.36-.07-.13h-.35v3.23h.43l.03-.22Z"/>
            <path className="m" d="M62.77,19.61c4.07-4.05,10.65-4.05,14.72,0l-1.38,1.37-1.37,1.37c-.57-.59-1.25-1.06-2-1.39h-.08c-1.6-.65-3.4-.65-5,0h0c-.78,.33-1.5,.81-2.1,1.41l-1.45-1.39-1.37-1.37h.03Zm-11.72-11.72c10.54-10.52,27.61-10.52,38.15,0l-1.37,1.37-1.36,1.37c-.49-.48-1-.94-1.5-1.38-8.56-7.18-21.04-7.2-29.62-.05-.54,.45-1.06,.93-1.56,1.43l-1.37-1.37-1.37-1.37Zm5.93,5.94l1.37,1.37,1.37,1.37c.51-.52,1.06-1,1.65-1.43,.96-.72,2.01-1.31,3.12-1.77,5.5-2.29,11.85-1.03,16.05,3.2l1.37-1.37,1.37-1.37c-1.72-1.71-3.76-3.07-6-4-.5-.2-1-.39-1.53-.55-3.61-1.14-7.49-1.14-11.1,0-.54,.17-1.07,.36-1.59,.57-2.24,.93-4.28,2.29-6,4l-.08-.02Z"/>
          </g>
        </svg>
      </div>

      {/* Main Card */}
      <div className="relative bg-white dark:bg-[#25363F] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          {/* Header with Settings and Dark Mode Toggle */}
          <div className="flex items-start justify-between mb-10">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#f7a83c] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#333c50] dark:text-white">
                    Guest WiFi Access
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create WiFi credentials for hotel guests
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Panel and Dark Mode Toggle */}
            <div className="flex items-start space-x-3">
              {/* View Guests Button */}
              <a
                href="/guests"
                className="p-3 bg-[#f1f3f6] dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#3d4a5f] transition-all shadow-md group flex items-center space-x-2"
                title="View all guests"
              >
                <svg className="w-5 h-5 text-[#f7a83c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-sm font-semibold text-[#333c50] dark:text-white whitespace-nowrap">View Guests</span>
              </a>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 bg-[#f1f3f6] dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#3d4a5f] transition-all shadow-md group"
                aria-label="Toggle dark mode"
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

              {/* Settings Gear Icon */}
              <a
                href="/settings"
                className="p-3 bg-[#f1f3f6] dark:bg-[#333c50] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-[#3d4a5f] transition-all shadow-md group"
                title="Configure site and portal settings"
              >
                <svg className="w-5 h-5 text-[#f7a83c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 rounded-lg shadow-md animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 dark:text-red-200 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-l-4 border-green-500 rounded-lg shadow-md animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 dark:text-green-200 text-sm font-semibold">{success}</p>
              </div>
            </div>
          )}

          {/* Main Form - Beautiful and Modern */}
          {!fetchingSites && (!needsSiteSelection || selectedSite) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number - Beautiful Card */}
              <div className="group">
                <label htmlFor="username" className="flex items-center space-x-2 text-base font-bold text-[#333c50] dark:text-white mb-3">
                  <div className="w-8 h-8 bg-[#f7a83c] rounded-lg flex items-center justify-center shadow-md group-focus-within:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span>Room Number</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-5 text-3xl font-mono bg-[#f1f3f6] dark:bg-[#333c50] border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#f7a83c]/20 focus:border-[#f7a83c] dark:text-white transition-all shadow-inner hover:shadow-lg"
                  placeholder="101"
                  pattern="^[a-zA-Z0-9_-]+$"
                  minLength={1}
                  maxLength={32}
                  required
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>This will be the WiFi username</span>
                </p>
              </div>

              {/* Guest Last Name - Beautiful Card */}
              <div className="group">
                <label htmlFor="password" className="flex items-center space-x-2 text-base font-bold text-[#333c50] dark:text-white mb-3">
                  <div className="w-8 h-8 bg-[#f7a83c] rounded-lg flex items-center justify-center shadow-md group-focus-within:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span>Guest Last Name</span>
                </label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-5 text-3xl bg-[#f1f3f6] dark:bg-[#333c50] border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#f7a83c]/20 focus:border-[#f7a83c] dark:text-white transition-all shadow-inner hover:shadow-lg"
                  placeholder="Smith"
                  minLength={3}
                  required
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>This will be the WiFi password (min. 3 characters)</span>
                </p>
              </div>

              {/* Checkout Date - Beautiful Card */}
              <div className="group">
                <label htmlFor="checkoutDate" className="flex items-center space-x-2 text-base font-bold text-[#333c50] dark:text-white mb-3">
                  <div className="w-8 h-8 bg-[#f7a83c] rounded-lg flex items-center justify-center shadow-md group-focus-within:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span>Checkout Date & Time</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  id="checkoutDate"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  min={(() => {
                    // Get current date/time in LOCAL timezone for the min attribute
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
                  className="w-full px-6 py-5 text-xl bg-[#f1f3f6] dark:bg-[#333c50] border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#f7a83c]/20 focus:border-[#f7a83c] dark:text-white transition-all shadow-inner hover:shadow-lg"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Times are shown in <strong className="text-[#f7a83c]">{userTimezone || 'your local timezone'}</strong></span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 pl-5">
                    Leave empty for 30-day access from today
                  </p>
                </div>
              </div>

              {/* Submit Button - Moby Orange */}
              <button
                type="submit"
                disabled={loading || fetchingPortals || portals.length === 0 || selectedPortals.length === 0}
                className="relative w-full group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="bg-[#f7a83c] hover:bg-[#e89729] disabled:bg-gray-400 px-8 py-6 rounded-xl flex items-center justify-center space-x-3 disabled:opacity-50 transition-colors">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-xl font-bold text-white">Creating Access...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xl font-bold text-white">Create WiFi Access</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(247, 168, 60, 0.4);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(247, 168, 60, 0.7);
        }
        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-0.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slide-in-from-top-2 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
