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
    search: (term) => ['species', 'search', term],
  },
  specimens: {
    all: ['specimens'],
    list: (filters) => ['specimens', 'list', filters],
    detail: (id) => ['specimens', 'detail', id],
  },
  collection: {
    all: ['collection'],
  },
  observations: {
    all: ['observations'],
    list: (search, status) => ['observations', 'list', search, status],
    detail: (id) => ['observations', id],
  },
  identificationKeys: {
    all: ['identification-keys'],
    list: (filters) => ['identification-keys', 'list', filters],
    detail: (id) => ['identification-keys', 'detail', id],
    discovery: (term) => ['identification-keys', 'discovery', term],
    runs: (observationId) => ['identification-keys', 'runs', observationId],
  },
  taxonomy: {
    browse: (rank, parentKey, search = '') => ['taxonomy', rank, parentKey || 'plantae', search],
    profile: (taxonKey) => ['taxonomy', 'profile', taxonKey],
  },
  careLogs: {
    bySpecimen: (specimenId) => ['care-logs', specimenId],
  },
  visualEntries: {
    bySpecimen: (specimenId) => ['visual-entries', specimenId],
  },
  weather: {
    current: (lat, lon) => ['weather', lat, lon],
  },
};

export async function searchSpecies(term) {
  const response = await apiClient.get('/api/species/', { params: { search: term } });
  return response.data;
}

export async function createSpecimen(formData) {
  const response = await apiClient.post('/api/specimens/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function createLocalSpecies(scientificName) {
  const response = await apiClient.post('/api/species/local/', { scientific_name: scientificName });
  return response.data;
}

export async function createObservation(formData) {
  const response = await apiClient.post('/api/observations/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function fetchObservation(id) {
  const response = await apiClient.get(`/api/observations/${id}/`);
  return response.data;
}

export async function updateObservation(id, payload) {
  const response = await apiClient.patch(`/api/observations/${id}/`, payload);
  return response.data;
}

export async function addObservationEvidence(id, formData) {
  const response = await apiClient.post(`/api/observations/${id}/evidence/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateObservationEvidence(id, evidenceId, payload) {
  const response = await apiClient.patch(`/api/observations/${id}/evidence/${evidenceId}/`, payload);
  return response.data;
}

export async function addObservationHypothesis(id, payload) {
  const response = await apiClient.post(`/api/observations/${id}/hypotheses/`, payload);
  return response.data;
}

export async function setHypothesisStatus(id, hypothesisId, status) {
  const response = await apiClient.patch(`/api/observations/${id}/hypotheses/${hypothesisId}/`, { status });
  return response.data;
}

export async function updateHypothesisNotes(id, hypothesisId, notes) {
  const response = await apiClient.patch(`/api/observations/${id}/hypotheses/${hypothesisId}/`, { notes });
  return response.data;
}

export async function confirmObservation(id, hypothesisId, notes = '') {
  const response = await apiClient.post(`/api/observations/${id}/confirm/`, { hypothesis_id: hypothesisId, notes });
  return response.data;
}

export async function reopenObservation(id, notes = '') {
  const response = await apiClient.post(`/api/observations/${id}/reopen/`, { notes });
  return response.data;
}

export async function listIdentificationKeys(params = {}) {
  const response = await apiClient.get('/api/identification-keys/', { params });
  return response.data;
}

export async function fetchIdentificationKey(id) {
  const response = await apiClient.get(`/api/identification-keys/${id}/`);
  return response.data;
}

export async function discoverIdentificationKeys(search) {
  return (await apiClient.get('/api/identification-keys/discover/', { params: { search } })).data;
}

export async function importIdentificationKey(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value);
  });
  return (await apiClient.post('/api/identification-keys/imports/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
  })).data;
}

export async function saveIdentificationKey(id, payload) {
  const response = id
    ? await apiClient.patch(`/api/identification-keys/${id}/`, payload)
    : await apiClient.post('/api/identification-keys/', payload);
  return response.data;
}

export async function publishIdentificationKey(id) {
  return (await apiClient.post(`/api/identification-keys/${id}/publish/`)).data;
}

export async function archiveIdentificationKey(id) {
  return (await apiClient.post(`/api/identification-keys/${id}/archive/`)).data;
}

export async function listKeySuggestions(id) {
  return (await apiClient.get(`/api/identification-keys/${id}/suggestions/`)).data;
}

export async function suggestKeyChange(id, graph, note) {
  return (await apiClient.post(`/api/identification-keys/${id}/suggestions/`, { graph, note })).data;
}

export async function decideKeySuggestion(id, suggestionId, decision) {
  return (await apiClient.post(`/api/identification-keys/${id}/suggestions/${suggestionId}/decision/`, { decision })).data;
}

export async function reportIdentificationKey(id, reason) {
  return (await apiClient.post(`/api/identification-keys/${id}/reports/`, { reason })).data;
}

export async function listObservationKeyRuns(observationId) {
  return (await apiClient.get(`/api/observations/${observationId}/key-runs/`)).data;
}

export async function startObservationKeyRun(observationId, versionId, parentRun = null) {
  return (await apiClient.post(`/api/observations/${observationId}/key-runs/`, { version_id: versionId, parent_run: parentRun })).data;
}

export async function answerObservationKeyRun(observationId, runId, payload, correction = false) {
  const url = `/api/observations/${observationId}/key-runs/${runId}/answers/`;
  return (await (correction ? apiClient.patch(url, payload) : apiClient.post(url, payload))).data;
}

export async function browseTaxonomy({ rank, parentKey, search = '', offset = 0, limit = 6 }) {
  const response = await apiClient.get('/api/species/taxonomy/', {
    params: { rank, parent_key: parentKey || undefined, q: search || undefined, offset, limit },
  });
  return response.data;
}

export async function fetchTaxonomyProfile(taxonKey) {
  const response = await apiClient.get(`/api/species/taxonomy/${taxonKey}/profile/`, { timeout: 22000 });
  return response.data;
}

export async function fetchSpecimenDetail(specimenId) {
  const response = await apiClient.get(`/api/specimens/${specimenId}/`);
  return response.data;
}

export async function updateSpecimen({ specimenId, payload }) {
  const response = await apiClient.patch(`/api/specimens/${specimenId}/`, payload);
  return response.data;
}

export async function listCareLogs(specimenId, page = 1) {
  const response = await apiClient.get('/api/care-logs/', { params: { specimen_id: specimenId, page } });
  return response.data;
}

export async function createCareLog(payload) {
  const response = await apiClient.post('/api/care-logs/', payload);
  return response.data;
}

export async function listVisualEntries(specimenId, page = 1) {
  const response = await apiClient.get('/api/visual-entries/', { params: { specimen_id: specimenId, page } });
  return response.data;
}

export async function createVisualEntry(formData) {
  const response = await apiClient.post('/api/visual-entries/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

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
