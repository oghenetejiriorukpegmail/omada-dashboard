'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Portal {
  id: string;
  name: string;
  enable: boolean;
  ssidList: string[];
}

interface Site {
  siteId: string;
  name: string;
  region?: string;
  scenario?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [portals, setPortals] = useState<Portal[]>([]);
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingSites, setFetchingSites] = useState(true);
  const [fetchingPortals, setFetchingPortals] = useState(false);
  const [needsSiteSelection, setNeedsSiteSelection] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  // Load saved settings
  useEffect(() => {
    const savedSite = localStorage.getItem('selectedSite');
    const savedPortals = localStorage.getItem('selectedPortals');

    if (savedSite) {
      setSelectedSite(savedSite);
    }

    if (savedPortals) {
      try {
        setSelectedPortals(JSON.parse(savedPortals));
      } catch (e) {
        console.error('Failed to parse saved portals', e);
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
      } else {
        const sitesResponse = await fetch('/api/sites');
        const sitesData = await sitesResponse.json();

        if (!sitesResponse.ok) {
          throw new Error(sitesData.error || 'Failed to fetch sites');
        }

        setSites(sitesData.sites);
        setNeedsSiteSelection(true);

        if (sitesData.sites.length === 1) {
          setSelectedSite(sitesData.sites[0].siteId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setFetchingSites(false);
      setLoading(false);
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

  const handleSave = () => {
    // Save to localStorage
    if (selectedSite) {
      localStorage.setItem('selectedSite', selectedSite);
    }
    localStorage.setItem('selectedPortals', JSON.stringify(selectedPortals));

    setSuccess('Settings saved successfully!');

    // Redirect back to home after a short delay
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a2332] dark:to-[#25363F] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Moby Logo */}
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
                <h1 className="text-4xl font-bold text-[#333c50] dark:text-white">Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure site and network access
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
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
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-[#25363F] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-[#f7a83c] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#333c50] dark:text-white">
                  Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select site and network portals
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm font-semibold">{success}</p>
              </div>
            )}

            {/* Loading State */}
            {fetchingSites ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f7a83c]"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Site Selection */}
                {needsSiteSelection && (
                  <div>
                    <label htmlFor="site" className="block text-lg font-semibold text-[#333c50] dark:text-white mb-3">
                      Site Location
                    </label>
                    <select
                      id="site"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="w-full px-4 py-3 text-lg bg-[#f1f3f6] dark:bg-[#333c50] border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#f7a83c]/20 focus:border-[#f7a83c] dark:text-white transition-all"
                      required
                    >
                      <option value="">Select site...</option>
                      {sites.map((site) => (
                        <option key={site.siteId} value={site.siteId}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Portal Selection */}
                {(!needsSiteSelection || selectedSite) && (
                  <div>
                    <label className="block text-lg font-semibold text-[#333c50] dark:text-white mb-3">
                      Network Access
                    </label>
                    {fetchingPortals ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7a83c]"></div>
                      </div>
                    ) : portals.length === 0 ? (
                      <div className="text-sm text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        No portals available
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {portals.map((portal) => (
                          <label
                            key={portal.id}
                            className="flex items-start space-x-3 cursor-pointer group p-4 bg-[#f1f3f6] dark:bg-[#333c50] rounded-xl hover:bg-gray-200 dark:hover:bg-[#3d4a5f] transition-colors border-2 border-transparent hover:border-[#f7a83c]"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPortals.includes(portal.id)}
                              onChange={() => handlePortalToggle(portal.id)}
                              className="mt-1 h-5 w-5 text-[#f7a83c] focus:ring-2 focus:ring-[#f7a83c] border-gray-300 rounded transition-all accent-[#f7a83c]"
                            />
                            <div className="flex-1">
                              <div className="text-base font-semibold text-[#333c50] dark:text-white group-hover:text-[#f7a83c] transition-colors">
                                {portal.name}
                              </div>
                              {portal.ssidList && portal.ssidList.length > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                  </svg>
                                  <span>{portal.ssidList.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-6">
                  <button
                    onClick={handleSave}
                    disabled={loading || selectedPortals.length === 0}
                    className="w-full bg-[#f7a83c] hover:bg-[#e89729] disabled:bg-gray-400 px-8 py-4 rounded-xl flex items-center justify-center space-x-3 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xl font-bold text-white">Save Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
