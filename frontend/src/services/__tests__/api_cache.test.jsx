import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import React from 'react';

// Mock apiClient
vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import apiClient from '../apiClient';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('TanStack Query cache integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('caches API response and returns cached data on subsequent calls', async () => {
    const mockData = {
      data: {
        results: [
          { id: 1, scientific_name: 'Monstera deliciosa', is_owned: true },
        ],
      },
    };
    apiClient.get.mockResolvedValue(mockData);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['species-test'],
          queryFn: () => apiClient.get('/api/species/').then((r) => r.data),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.results).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('does not refetch within staleTime window', async () => {
    const mockData = { data: { results: [] } };
    apiClient.get.mockResolvedValue(mockData);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 1000 * 60 * 5 },
      },
    });
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // First render
    const { result: result1 } = renderHook(
      () =>
        useQuery({
          queryKey: ['no-refetch-test'],
          queryFn: () => apiClient.get('/api/specimens/').then((r) => r.data),
        }),
      { wrapper }
    );
    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Second render uses cache
    const { result: result2 } = renderHook(
      () =>
        useQuery({
          queryKey: ['no-refetch-test'],
          queryFn: () => apiClient.get('/api/specimens/').then((r) => r.data),
        }),
      { wrapper }
    );
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['error-test'],
          queryFn: () => apiClient.get('/api/weather/current/').then((r) => r.data),
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe('Network Error');
  });
});
