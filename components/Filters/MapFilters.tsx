'use client';

import { useEffect, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { api } from '@/lib/api';

interface MapFiltersProps {
  filters: {
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
  };
  onFilterChange: (filters: MapFiltersProps['filters']) => void;
  counties: string[];
  propertiesCount?: number;
}

export default function MapFilters({ filters, onFilterChange, counties, propertiesCount = 0 }: MapFiltersProps) {
  const [dateRange, setDateRange] = useState<{ min_year: number; max_year: number } | null>(null);
  const [loadingDateRange, setLoadingDateRange] = useState(true);
  
  // Calculate year range: min from DB, max is current year
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1; // Last year for default
  
  // Use DB min year if available, otherwise fallback to last year
  const minYear = dateRange?.min_year ?? lastYear;
  const maxYear = dateRange?.max_year ?? currentYear;
  
  // Get year from date string (YYYY-MM-DD format)
  const getYearFromDate = (dateStr?: string): number => {
    if (!dateStr) return lastYear; // Default to last year for left slider
    const year = parseInt(dateStr.split('-')[0]);
    return isNaN(year) ? lastYear : year;
  };
  
  // Convert year to start date string (YYYY-01-01 format)
  const yearToStartDate = (year: number): string => {
    return `${year}-01-01`;
  };
  
  // Convert year to end date string (YYYY-12-31 format)
  const yearToEndDate = (year: number): string => {
    return `${year}-12-31`;
  };
  
  // Fetch date range from API on mount
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const range = await api.getDateRange();
        setDateRange(range);
      } catch (error) {
        console.error('Error fetching date range:', error);
        // Fallback to last year - current year
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        setDateRange({ min_year: lastYear, max_year: currentYear });
      } finally {
        setLoadingDateRange(false);
      }
    };
    fetchDateRange();
  }, []);
  
  // Set default end date to current year's last day if not set
  useEffect(() => {
    if (!filters.endDate && !loadingDateRange) {
      onFilterChange({
        ...filters,
        endDate: yearToEndDate(currentYear),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingDateRange]); // Run when date range loading completes
  
  // Get current year values from filters
  // Default left slider to last year, right slider to current year
  const minYearValue = getYearFromDate(filters.startDate);
  const maxYearValue = getYearFromDate(filters.endDate) || currentYear;
  
  const handleChange = (key: string, value: string | number | boolean | undefined) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };
  
  const handleYearChange = (values: number[]) => {
    const [minYearVal, maxYearVal] = values.sort((a, b) => a - b);
    onFilterChange({
      ...filters,
      startDate: yearToStartDate(minYearVal),
      endDate: yearToEndDate(maxYearVal),
    });
  };
  
  // Price range configuration
  const minPrice = 0;
  const maxPrice = 5000000; // 5 million as max
  const currentMinPrice = filters.minPrice || minPrice;
  const currentMaxPrice = filters.maxPrice || maxPrice;
  
  const handlePriceChange = (values: number[]) => {
    const [minPriceVal, maxPriceVal] = values.sort((a, b) => a - b);
    onFilterChange({
      ...filters,
      minPrice: minPriceVal === minPrice ? undefined : minPriceVal,
      maxPrice: maxPriceVal === maxPrice ? undefined : maxPriceVal,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      
      {/* Year Range Dual Slider */}
      <div>
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            Sale Year Range
          </label>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {minYearValue} - {maxYearValue}
          </span>
        </div>
        {loadingDateRange ? (
          <div className="h-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <Slider
              range
              min={minYear}
              max={maxYear}
              value={[minYearValue, maxYearValue]}
              onChange={(values) => {
                if (Array.isArray(values)) {
                  handleYearChange(values);
                }
              }}
              trackStyle={[{ backgroundColor: '#3b82f6', height: 6 }]}
              handleStyle={[
                { borderColor: '#3b82f6', height: 20, width: 20, marginTop: -7 },
                { borderColor: '#3b82f6', height: 20, width: 20, marginTop: -7 },
              ]}
              railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>{minYear}</span>
              <span>{maxYear}</span>
            </div>
          </>
        )}
      </div>

      {/* County Selection */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          County
        </label>
        <select
          value={filters.county || ''}
          onChange={(e) => handleChange('county', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">All Counties</option>
          {counties.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Dual Slider */}
      <div>
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            Price Range (€)
          </label>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {currentMinPrice === minPrice ? 'Any' : `€${currentMinPrice.toLocaleString()}`} - {currentMaxPrice === maxPrice ? 'Any' : `€${currentMaxPrice.toLocaleString()}`}
          </span>
        </div>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          step={10000}
          value={[currentMinPrice, currentMaxPrice]}
          onChange={(values) => {
            if (Array.isArray(values)) {
              handlePriceChange(values);
            }
          }}
          trackStyle={[{ backgroundColor: '#3b82f6', height: 6 }]}
          handleStyle={[
            { borderColor: '#3b82f6', height: 20, width: 20, marginTop: -7 },
            { borderColor: '#3b82f6', height: 20, width: 20, marginTop: -7 },
          ]}
          railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>€{minPrice.toLocaleString()}</span>
          <span>€{maxPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Filters
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasGeocoding === true}
              onChange={(e) => handleChange('hasGeocoding', e.target.checked ? true : undefined)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Has Geocoding</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasDaftData === true}
              onChange={(e) => handleChange('hasDaftData', e.target.checked ? true : undefined)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Has Daft.ie Data</span>
          </label>
        </div>
      </div>

      {/* Property Count Display */}
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white dark:from-blue-700 dark:to-indigo-800 flex items-center space-x-3 sm:space-x-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-90">Properties Found</p>
          <p className="text-2xl sm:text-3xl font-bold">{propertiesCount.toLocaleString()}</p>
          <p className="text-xs opacity-80">in current view</p>
        </div>
      </div>
    </div>
  );
}

