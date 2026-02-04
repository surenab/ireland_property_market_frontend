'use client';

import { useEffect, useState } from 'react';
import { api, PriceTrendPoint, CountyStatistics } from '@/lib/api';
import UnifiedPriceChart from '@/components/Statistics/UnifiedPriceChart';
import CountyComparisonChart from '@/components/Statistics/CountyComparisonChart';
import MapFilters from '@/components/Filters/MapFilters';

export default function StatisticsPage() {
  const [priceTrends, setPriceTrends] = useState<PriceTrendPoint[]>([]);
  const [countyStats, setCountyStats] = useState<CountyStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [counties, setCounties] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
  }>({});
  
  // Metric selection state
  const [selectedMetrics, setSelectedMetrics] = useState({
    average: true,
    median: true,
    stdDev: false,
  });

  useEffect(() => {
    loadCounties();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod, filters]);

  const loadCounties = async () => {
    try {
      const countiesList = await api.listCounties();
      setCounties(countiesList);
    } catch (error) {
      console.error('Error loading counties:', error);
      setCounties([]);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [trends, counties] = await Promise.all([
        api.getPriceTrends({ 
          period: selectedPeriod,
          county: filters.county,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          start_date: filters.startDate,
          end_date: filters.endDate,
          has_geocoding: filters.hasGeocoding,
          has_daft_data: filters.hasDaftData,
        }),
        api.getCountyComparison(),
      ]);

      setPriceTrends(trends.trends);
      setCountyStats(counties.counties);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricToggle = (metric: 'average' | 'median' | 'stdDev') => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Statistics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive analysis of Irish property data</p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <MapFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          counties={counties}
        />
      </div>

      {/* Period Selector */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="mr-4 text-gray-700 dark:text-gray-300 font-medium">Period:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Unified Price Trends Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-200 dark:border-gray-700">
        <UnifiedPriceChart 
          data={priceTrends} 
          selectedMetrics={selectedMetrics}
          onMetricToggle={handleMetricToggle}
        />
      </div>

      {/* County Comparison */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-200 dark:border-gray-700">
        <CountyComparisonChart data={countyStats} />
      </div>
    </div>
  );
}
