/**
 * Debug logging utility for API calls
 * Logs API requests and responses to browser console when debug mode is enabled
 */

export const isDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('debugMode') === 'true';
};

export const debugLog = {
  apiRequest: (endpoint: string, options?: RequestInit) => {
    if (!isDebugMode()) return;

    console.group(`🔵 API Request: ${options?.method || 'GET'} ${endpoint}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Endpoint:', endpoint);

    if (options?.method) {
      console.log('Method:', options.method);
    }

    if (options?.headers) {
      console.log('Headers:', options.headers);
    }

    if (options?.body) {
      try {
        const body = JSON.parse(options.body as string);
        console.log('Request Body:', body);
      } catch {
        console.log('Request Body:', options.body);
      }
    }

    console.groupEnd();
  },

  apiResponse: (endpoint: string, response: Response, data?: unknown) => {
    if (!isDebugMode()) return;

    const statusColor = response.ok ? '🟢' : '🔴';
    console.group(`${statusColor} API Response: ${response.status} ${endpoint}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Status:', response.status, response.statusText);
    console.log('OK:', response.ok);

    if (data) {
      console.log('Response Data:', data);
    }

    console.groupEnd();
  },

  apiError: (endpoint: string, error: unknown) => {
    if (!isDebugMode()) return;

    console.group(`🔴 API Error: ${endpoint}`);
    console.log('Timestamp:', new Date().toISOString());
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Error Message:', errorMessage);
    console.groupEnd();
  },

  info: (message: string, ...args: unknown[]) => {
    if (!isDebugMode()) return;
    console.log(`ℹ️ [DEBUG] ${message}`, ...args);
  }
};
