'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  api,
  PriceTrendPoint,
  CountyStatistics,
  DatabaseStatsResponse,
  PriceDistributionBucket,
} from '@/lib/api';
import UnifiedPriceChart from '@/components/Statistics/UnifiedPriceChart';
import CountyComparisonChart from '@/components/Statistics/CountyComparisonChart';
import SalesVolumeChart from '@/components/Statistics/SalesVolumeChart';
import PriceDistributionChart from '@/components/Statistics/PriceDistributionChart';
import MapFilters from '@/components/Filters/MapFilters';

export default function StatisticsPage() {
  const [priceTrends, setPriceTrends] = useState<PriceTrendPoint[]>([]);
  const [countyStats, setCountyStats] = useState<CountyStatistics[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStatsResponse | null>(null);
  const [priceDistribution, setPriceDistribution] = useState<PriceDistributionBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [counties, setCounties] = useState<string[]>([]);

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    min2Sales?: boolean;
  }>({
    startDate: '2010-01-01',
    endDate: '2026-12-31',
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    average: true,
    median: true,
    stdDev: false,
  });

  const statParams = {
    county: filters.county,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    start_date: filters.startDate,
    end_date: filters.endDate,
    has_geocoding: filters.hasGeocoding,
    has_daft_data: filters.hasDaftData,
  };

  useEffect(() => {
    loadCounties();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod, filters]);

  const loadCounties = async () => {
    try {
      const countiesList = await api.listCounties();
      setTimeout(() => setCounties(countiesList || []), 0);
    } catch {
      setTimeout(() => setCounties([]), 0);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [trendsRes, countyRes, dbRes, distRes] = await Promise.all([
        api.getPriceTrends({
          period: selectedPeriod,
          ...statParams,
        }),
        api.getCountyComparison(statParams),
        api.getDatabaseStats(),
        api.getPriceDistribution(statParams),
      ]);

      startTransition(() => {
        setTimeout(() => {
          setPriceTrends(trendsRes.trends);
          setCountyStats(countyRes.counties);
          setDbStats(dbRes);
          setPriceDistribution(distRes.buckets);
          setLoading(false);
        }, 0);
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      setLoading(false);
    }
  };

  const handleMetricToggle = (metric: 'average' | 'median' | 'stdDev') => {
    setSelectedMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const totalPropertiesCount = priceTrends.reduce((sum, trend) => sum + (trend.count || 0), 0);
  const salesVolumeData = priceTrends.map((t) => ({ date: t.date, count: t.count }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full">
        {/* Left: filters – 25% on desktop; hidden on mobile (Filters button + collapsible panel) */}
        <aside className="hidden md:block md:w-1/4 md:max-w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="p-4 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            <MapFilters
              filters={filters}
              onFilterChange={setFilters}
              counties={counties}
              propertiesCount={totalPropertiesCount}
            />
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Right: statistical data – 75% (full width on mobile with Filters bar) */}
        <main className="flex-1 min-w-0 overflow-auto">
          {/* Mobile: sticky bar with title + Filters button + collapsible panel (same as search/heatmap) */}
          <div className="md:hidden shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate min-w-0">
                Statistics
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={mobileFiltersOpen}
                aria-label={mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
              >
                {mobileFiltersOpen ? 'Done' : 'Filters'}
              </button>
            </div>
            {mobileFiltersOpen && (
              <div className="px-3 pb-3 pt-0 border-t border-gray-100 dark:border-gray-800">
                <MapFilters
                  compact
                  filters={filters}
                  onFilterChange={setFilters}
                  counties={counties}
                  propertiesCount={totalPropertiesCount}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6 hidden md:block">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Statistics Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Analysis of Irish property data</p>
            </div>

            {/* Database stats cards */}
            {dbStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {dbStats.total_properties.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Addresses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {dbStats.total_addresses.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price history records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {dbStats.total_price_history.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Price trends line chart */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
              <UnifiedPriceChart
                data={priceTrends}
                selectedMetrics={selectedMetrics}
                onMetricToggle={handleMetricToggle}
              />
            </div>

            {/* Sales volume bar chart */}
            {salesVolumeData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                <SalesVolumeChart data={salesVolumeData} />
              </div>
            )}

            {/* Price distribution histogram */}
            {priceDistribution.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                <PriceDistributionChart data={priceDistribution} />
              </div>
            )}

            {/* County comparison bar chart */}
            {countyStats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <CountyComparisonChart data={countyStats} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
