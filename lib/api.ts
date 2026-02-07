/**
 * API client for communicating with FastAPI backend.
 */
import axios from 'axios';

// When NEXT_PUBLIC_API_URL is unset: same origin (''), Next.js rewrites /api/* to backend in dev (avoids CORS/network errors).
// Set NEXT_PUBLIC_API_URL to your backend URL (e.g. http://localhost:8080) to call it directly.
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof window === 'undefined' ? 'https://clownfish-app-bthm6.ondigitalocean.app' : '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log request → response time in browser console
apiClient.interceptors.request.use((config) => {
  (config as any)._apiStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const start = (response.config as any)._apiStartTime as number | undefined;
    if (typeof start === 'number') {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const ms = end - start;
      const method = (response.config.method || 'GET').toUpperCase();
      const pathOnly = response.config.url || '/';
      if (typeof console !== 'undefined' && console.info) {
        console.info(`[API] ${method} ${pathOnly} → ${ms.toFixed(2)} ms (request → response)`);
      }
    }
    return response;
  },
  (error) => {
    const config = error.config;
    const start = config?._apiStartTime as number | undefined;
    if (typeof start === 'number' && typeof console !== 'undefined' && console.info) {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const ms = end - start;
      const method = (config?.method || 'GET').toUpperCase();
      const path = (config?.url || config?.baseURL || '').replace(API_BASE_URL, '') || '/';
      console.info(`[API] ${method} ${path} → ${ms.toFixed(2)} ms (request → response, error)`);
    }
    return Promise.reject(error);
  }
);

// Simple in-memory cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(url: string, params?: any): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${url}?${paramsStr}`;
}

function getCachedResponse(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedResponse(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Clear cache entries older than TTL periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }, 60000); // Check every minute
}

// Types
export interface Property {
  id: number;
  created_at: string;
  updated_at: string;
  daft_url?: string;
  daft_html?: string;
  daft_title?: string;
  daft_body?: string;
  daft_scraped: boolean;
  daft_scraped_at?: string;
  address?: Address;
  price_history: PriceHistory[];
}

export interface Address {
  id: number;
  address: string;
  county: string;
  eircode?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  country?: string;
  geocoded_at?: string;
}

export interface PriceHistory {
  id: number;
  date_of_sale: string;
  price: number;
  not_full_market_price: boolean;
  vat_exclusive: boolean;
  description: string;
  property_size_description?: string;
}

export interface PropertyListItem {
  id: number;
  address?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  latest_price?: number;
  latest_sale_date?: string;
}

export interface PropertyListResponse {
  items: PropertyListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MapPoint {
  id: number;
  latitude: number;
  longitude: number;
  price?: number;
  address?: string;
  county?: string;
  date?: string;
}

export interface MapCluster {
  center_lat: number;
  center_lng: number;
  count: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  properties: MapPoint[];
}

export interface MapClustersResponse {
  clusters: MapCluster[];
  total_properties: number;
  viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface MapPointsResponse {
  points: MapPoint[];
  total: number;
}

export interface PriceTrendPoint {
  date: string;
  average_price: number;
  median_price: number;
  std_deviation: number;
  min_price: number;
  max_price: number;
  count: number;
}

export interface PriceTrendsResponse {
  trends: PriceTrendPoint[];
  period: string;
}

export interface PriceCluster {
  cluster_id: number;
  price_range: {
    min: number;
    max: number;
  };
  count: number;
  average_price: number;
  properties?: number[];
}

export interface ClustersResponse {
  clusters: PriceCluster[];
  algorithm: string;
  n_clusters: number;
}

export interface CountyStatistics {
  county: string;
  property_count: number;
  average_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  price_per_sqm?: number;
}

export interface CountyComparisonResponse {
  counties: CountyStatistics[];
  overall_average: number;
  overall_median: number;
}

export interface DatabaseStatsResponse {
  total_addresses: number;
  total_properties: number;
  total_price_history: number;
}

export interface PriceDistributionBucket {
  bucket_label: string;
  min_price: number;
  max_price: number;
  count: number;
}

export interface PriceDistributionResponse {
  buckets: PriceDistributionBucket[];
}

export interface CorrelationResponse {
  correlation_coefficient: number;
  p_value: number;
  sample_size: number;
  interpretation: string;
}

// API functions
export const api = {
  // Properties
  async getProperties(params?: {
    page?: number;
    page_size?: number;
    county?: string;
    min_price?: number;
    max_price?: number;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
    min_sales?: number;
    sort?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PropertyListResponse> {
    const cacheKey = getCacheKey('/api/properties', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/properties/', { params });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getProperty(id: number): Promise<Property> {
    const cacheKey = getCacheKey(`/api/properties/${id}`);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get(`/api/properties/${id}`);
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getPropertyHistory(id: number): Promise<PriceHistory[]> {
    const cacheKey = getCacheKey(`/api/properties/${id}/history`);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get(`/api/properties/${id}/history`);
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },


  async getMapPoints(params: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
    max_points?: number;
    zoom?: number;
    county?: string;
    min_price?: number;
    max_price?: number;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
    min_sales?: number;
    start_date?: string;
    end_date?: string;
  }, signal?: AbortSignal): Promise<MapPointsResponse> {
    const cacheKey = getCacheKey('/api/maps/points', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/maps/points', { 
      params,
      signal 
    });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getPropertiesInViewport(params: {
    north: number;
    south: number;
    east: number;
    west: number;
    page?: number;
    page_size?: number;
    county?: string;
    min_price?: number;
    max_price?: number;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
    min_sales?: number;
    start_date?: string;
    end_date?: string;
  }, signal?: AbortSignal): Promise<PropertyListResponse> {
    const cacheKey = getCacheKey('/api/maps/list', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    const response = await apiClient.get('/api/maps/list', { params, signal });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getMapAnalysis(params: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
    analysis_mode: string;
    zoom?: number;
    county?: string;
    start_date?: string;
    end_date?: string;
    min_price?: number;
    max_price?: number;
    pattern_type?: string;
    radius?: number;
    intensity?: number;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
  }, signal?: AbortSignal): Promise<any> {
    const cacheKey = getCacheKey('/api/maps/analysis', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/maps/analysis', { 
      params,
      signal 
    });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  // Statistics
  async getPriceTrends(params?: {
    period?: 'monthly' | 'quarterly' | 'yearly';
    county?: string;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    end_date?: string;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
  }): Promise<PriceTrendsResponse> {
    const cacheKey = getCacheKey('/api/statistics/price-trends', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/statistics/price-trends', { params });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },


  async getCountyComparison(params?: {
    county?: string;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    end_date?: string;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
  }): Promise<CountyComparisonResponse> {
    const cacheKey = getCacheKey('/api/statistics/county', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/statistics/county', { params });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getDatabaseStats(): Promise<DatabaseStatsResponse> {
    const cacheKey = getCacheKey('/api/statistics/db-stats');
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/statistics/db-stats');
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async getPriceDistribution(params?: {
    county?: string;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    end_date?: string;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
  }): Promise<PriceDistributionResponse> {
    const cacheKey = getCacheKey('/api/statistics/price-distribution', params);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/statistics/price-distribution', { params });
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },


  // Address endpoints
  async getAddress(addressId: number): Promise<Address> {
    const cacheKey = getCacheKey(`/api/addresses/${addressId}`);
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get(`/api/addresses/${addressId}`);
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async listCounties(): Promise<string[]> {
    const cacheKey = getCacheKey('/api/addresses/counties');
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/addresses/counties');
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },

  async listCountries(): Promise<string[]> {
    const cacheKey = getCacheKey('/api/addresses/countries');
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    const response = await apiClient.get('/api/addresses/countries');
    setCachedResponse(cacheKey, response.data);
    return response.data;
  },
};

/** PPR CSV upload response (protected endpoint). */
export interface PprUploadResponse {
  total_rows: number;
  unique_properties: number;
  created: number;
  updated: number;
  skipped: number;
  geocoded: number;
  failed_geocode: number;
  daft_scraped: number;
  failed_daft: number;
  errors: string[];
}

/** Response when starting async PPR import (upload or download-and-import). */
export interface PprImportJobStartResponse {
  job_id: string;
}

/** Status of an async PPR import job. */
export interface PprImportStatusResponse {
  status: 'running' | 'completed' | 'failed';
  result?: PprUploadResponse | null;
  error?: string | null;
}

const PPR_IMPORT_POLL_MS = 2000;

/** Poll until job completes or fails; returns result or throws with error message. */
async function pollPprImportUntilDone(
  jobId: string,
  onStatus?: (status: PprImportStatusResponse) => void
): Promise<PprUploadResponse> {
  for (;;) {
    const { data } = await apiClient.get<PprImportStatusResponse>(
      `/api/admin/ppr-import-status/${jobId}`,
      { timeout: 15000 }
    );
    if (onStatus) onStatus(data);
    if (data.status === 'completed' && data.result) return data.result;
    if (data.status === 'failed') {
      throw new Error(data.error ?? 'Import failed');
    }
    await new Promise((r) => setTimeout(r, PPR_IMPORT_POLL_MS));
  }
}

/** Download PPR-ALL.zip and import. Starts async job and polls until done; notifies via onStatus. */
export async function downloadPprAndImport(
  onStatus?: (status: PprImportStatusResponse) => void
): Promise<PprUploadResponse> {
  const response = await apiClient.post<PprImportJobStartResponse>(
    '/api/admin/ppr-download-and-import',
    {},
    { timeout: 15000 }
  );
  const jobId = response.data.job_id;
  return pollPprImportUntilDone(jobId, onStatus);
}

export default api;

