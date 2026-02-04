/**
 * API client for communicating with FastAPI backend.
 */
import axios from 'axios';

// Use relative URLs if NEXT_PUBLIC_API_URL is empty (same origin), otherwise use the provided URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? 'https://clownfish-app-bthm6.ondigitalocean.app' : 'https://clownfish-app-bthm6.ondigitalocean.app');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export interface CorrelationResponse {
  correlation_coefficient: number;
  p_value: number;
  sample_size: number;
  interpretation: string;
}

export interface SearchResponse {
  properties: PropertyListItem[];
  total: number;
  query: string;
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
  }): Promise<PropertyListResponse> {
    const response = await apiClient.get('/api/properties', { params });
    return response.data;
  },

  async getProperty(id: number): Promise<Property> {
    const response = await apiClient.get(`/api/properties/${id}`);
    return response.data;
  },

  async getPropertyHistory(id: number): Promise<PriceHistory[]> {
    const response = await apiClient.get(`/api/properties/${id}/history`);
    return response.data;
  },

  // Map
  async getMapClusters(params: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom?: number;
    cluster_mode?: string;
  }): Promise<MapClustersResponse> {
    const response = await apiClient.get('/api/map/clusters', { params });
    return response.data;
  },

  async getMapPoints(params: {
    north: number;
    south: number;
    east: number;
    west: number;
    max_points?: number;
    county?: string;
    min_price?: number;
    max_price?: number;
    has_geocoding?: boolean;
    has_daft_data?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<MapPointsResponse> {
    const response = await apiClient.get('/api/map/points', { params });
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
    const response = await apiClient.get('/api/statistics/price-trends', { params });
    return response.data;
  },

  async getPriceClusters(params?: {
    n_clusters?: number;
    algorithm?: 'kmeans' | 'dbscan';
    county?: string;
  }): Promise<ClustersResponse> {
    const response = await apiClient.get('/api/statistics/clusters', { params });
    return response.data;
  },

  async getCountyComparison(): Promise<CountyComparisonResponse> {
    const response = await apiClient.get('/api/statistics/county');
    return response.data;
  },

  async getCorrelation(params?: {
    variable?: 'size' | 'date';
  }): Promise<CorrelationResponse> {
    const response = await apiClient.get('/api/statistics/correlation', { params });
    return response.data;
  },

  // Address (moved from /api/search)
  async searchProperties(params: {
    q: string;
    limit?: number;
  }): Promise<SearchResponse> {
    const response = await apiClient.get('/api/address/search', { params });
    return response.data;
  },

  async autocomplete(params: {
    q: string;
    limit?: number;
  }): Promise<string[]> {
    const response = await apiClient.get('/api/address/autocomplete', { params });
    return response.data;
  },

  // Address endpoints
  async getAddress(addressId: number): Promise<Address> {
    const response = await apiClient.get(`/api/address/${addressId}`);
    return response.data;
  },

  async listAddresses(params?: {
    page?: number;
    page_size?: number;
    county?: string;
    has_geocoding?: boolean;
  }): Promise<{
    items: Address[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await apiClient.get('/api/address/', { params });
    return response.data;
  },

  async listCounties(): Promise<string[]> {
    const response = await apiClient.get('/api/address/counties');
    return response.data;
  },

  async listCountries(): Promise<string[]> {
    const response = await apiClient.get('/api/address/countries');
    return response.data;
  },

  // Statistics - Date Range
  async getDateRange(): Promise<{
    min_year: number;
    max_year: number;
    min_date: string;
    max_date: string;
  }> {
    const response = await apiClient.get('/api/statistics/date-range');
    return response.data;
  },
};

export default api;

