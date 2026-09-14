/**
 * API Client — Axios instance & TanStack Query cache provider configuration.
 * Constitution Principle IV: Supports TanStack Query caching for local-first responses.
 *   - Species/Specimens: 5-minute stale time (moderate refresh)
 *   - Weather data: 30-minute stale time (slow refresh, backend caches 1hr)
 *   - Default: 5-minute stale time, 1 retry
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token injection
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('access_email');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Query key factories for TanStack Query cache management.
 * Using a factory pattern ensures consistent cache invalidation across components.
 */
export const queryKeys = {
  species: {
    all: ['species'],
    list: (filters) => ['species', 'list', filters],
    detail: (id) => ['species', 'detail', id],
    gbifSearch: (name) => ['species', 'gbif-search', name],
  },
  specimens: {
    all: ['specimens'],
    list: (filters) => ['specimens', 'list', filters],
    detail: (id) => ['specimens', 'detail', id],
  },
  careLogs: {
    bySpecimen: (specimenId) => ['care-logs', specimenId],
  },
  weather: {
    current: (lat, lon) => ['weather', lat, lon],
  },
};

/**
 * Default QueryClient options for Persefone.
 * Constitution Principle IV: 5-min stale time for local-first caching.
 */
export const defaultQueryOptions = {
  queries: {
    staleTime: 1000 * 60 * 5,   // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  },
};

export default apiClient;
