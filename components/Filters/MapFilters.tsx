'use client';

import { useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface MapFiltersProps {
  filters: {
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    min2Sales?: boolean;
  };
  onFilterChange: (filters: MapFiltersProps['filters']) => void;
  counties: string[];
  propertiesCount?: number;
  /** Compact layout for mobile (dropdowns/inputs like map view filters) */
  compact?: boolean;
}

function formatPriceForInput(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function parsePriceInput(value: string): number | undefined {
  const trimmed = value.replace(/\s/g, '').replace(/,/g, '');
  if (trimmed === '') return undefined;
  const n = parseInt(trimmed, 10);
  return isNaN(n) || n < 0 ? undefined : n;
}

export default function MapFilters({ filters, onFilterChange, counties, propertiesCount = 0, compact = false }: MapFiltersProps) {
  // Hardcoded year range: 2010 to 2026
  const minYear = 2010;
  const maxYear = 2026;
  
  // Debounce timers
  const yearDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const priceDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Local state for immediate visual feedback
  const [localYearValues, setLocalYearValues] = useState<[number, number] | null>(null);
  const [localPriceValues, setLocalPriceValues] = useState<[number, number] | null>(null);
  
  // Get year from date string (YYYY-MM-DD format)
  const getYearFromDate = (dateStr?: string): number => {
    if (!dateStr) return minYear; // Default to min year for left slider
    const year = parseInt(dateStr.split('-')[0]);
    return isNaN(year) ? minYear : year;
  };
  
  // Convert year to start date string (YYYY-01-01 format)
  const yearToStartDate = (year: number): string => {
    return `${year}-01-01`;
  };
  
  // Convert year to end date string (YYYY-12-31 format)
  const yearToEndDate = (year: number): string => {
    return `${year}-12-31`;
  };
  
  // Set default dates if not set
  useEffect(() => {
    const updates: { startDate?: string; endDate?: string } = {};
    if (!filters.startDate) {
      updates.startDate = '2010-01-01';
    }
    if (!filters.endDate) {
      updates.endDate = '2026-12-31';
    }
    if (Object.keys(updates).length > 0) {
      onFilterChange({
        ...filters,
        ...updates,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
  
  // Get current year values from filters or local state
  const minYearValue = localYearValues ? localYearValues[0] : getYearFromDate(filters.startDate);
  const maxYearValue = localYearValues ? localYearValues[1] : (getYearFromDate(filters.endDate) || maxYear);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (yearDebounceTimer.current) {
        clearTimeout(yearDebounceTimer.current);
      }
      if (priceDebounceTimer.current) {
        clearTimeout(priceDebounceTimer.current);
      }
    };
  }, []);
  
  const handleChange = (key: string, value: string | number | boolean | undefined) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };
  
  const handleYearChange = (values: number[]) => {
    const [minYearVal, maxYearVal] = values.sort((a, b) => a - b);
    
    // Update local state immediately for visual feedback
    setLocalYearValues([minYearVal, maxYearVal]);
    
    // Clear existing timer
    if (yearDebounceTimer.current) {
      clearTimeout(yearDebounceTimer.current);
    }
    
    // Debounce the actual filter update
    yearDebounceTimer.current = setTimeout(() => {
      onFilterChange({
        ...filters,
        startDate: yearToStartDate(minYearVal),
        endDate: yearToEndDate(maxYearVal),
      });
      setLocalYearValues(null); // Clear local state after update
    }, 500); // 500ms delay
  };
  
  // Price range configuration
  const minPrice = 0;
  const maxPrice = 5000000; // 5 million as max
  const currentMinPrice = localPriceValues ? localPriceValues[0] : (filters.minPrice || minPrice);
  const currentMaxPrice = localPriceValues ? localPriceValues[1] : (filters.maxPrice || maxPrice);
  
  const handlePriceChange = (values: number[]) => {
    const [minPriceVal, maxPriceVal] = values.sort((a, b) => a - b);
    
    // Update local state immediately for visual feedback
    setLocalPriceValues([minPriceVal, maxPriceVal]);
    
    // Clear existing timer
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current);
    }
    
    // Debounce the actual filter update
    priceDebounceTimer.current = setTimeout(() => {
      onFilterChange({
        ...filters,
        minPrice: minPriceVal === minPrice ? undefined : minPriceVal,
        maxPrice: maxPriceVal === maxPrice ? undefined : maxPriceVal,
      });
      setLocalPriceValues(null); // Clear local state after update
    }, 500); // 500ms delay
  };

  const inputBase = 'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputCompact = 'py-2 px-2.5';

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  if (compact) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <select
          value={filters.county || ''}
          onChange={(e) => handleChange('county', e.target.value || undefined)}
          className={`w-full ${inputBase} ${inputCompact}`}
          aria-label="County"
        >
          <option value="">All Counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min €"
            value={formatPriceForInput(filters.minPrice)}
            onChange={(e) => {
              const v = parsePriceInput(e.target.value);
              onFilterChange({
                ...filters,
                minPrice: v === undefined ? undefined : v,
                maxPrice: v !== undefined && filters.maxPrice !== undefined && v > filters.maxPrice ? v : filters.maxPrice,
              });
            }}
            className={`min-w-0 flex-1 ${inputBase} ${inputCompact} placeholder-gray-400`}
            aria-label="Min price (€)"
          />
          <span className="shrink-0 text-gray-500 dark:text-gray-400 text-sm">–</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max €"
            value={formatPriceForInput(filters.maxPrice)}
            onChange={(e) => {
              const v = parsePriceInput(e.target.value);
              onFilterChange({
                ...filters,
                maxPrice: v === undefined ? undefined : v,
                minPrice: v !== undefined && filters.minPrice !== undefined && v < filters.minPrice ? v : filters.minPrice,
              });
            }}
            className={`min-w-0 flex-1 ${inputBase} ${inputCompact} placeholder-gray-400`}
            aria-label="Max price (€)"
          />
        </div>
        <div className="flex items-center gap-1">
          <select
            value={minYearValue}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10);
              onFilterChange({
                ...filters,
                startDate: yearToStartDate(y),
                endDate: getYearFromDate(filters.endDate) < y ? yearToEndDate(y) : filters.endDate,
              });
            }}
            className={`min-w-0 flex-1 ${inputBase} ${inputCompact}`}
            aria-label="From year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="shrink-0 text-gray-500 dark:text-gray-400 text-sm">–</span>
          <select
            value={maxYearValue}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10);
              onFilterChange({
                ...filters,
                endDate: yearToEndDate(y),
                startDate: getYearFromDate(filters.startDate) > y ? yearToStartDate(y) : filters.startDate,
              });
            }}
            className={`min-w-0 flex-1 ${inputBase} ${inputCompact}`}
            aria-label="To year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasGeocoding === true}
              onChange={(e) => handleChange('hasGeocoding', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Geocoding</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasDaftData === true}
              onChange={(e) => handleChange('hasDaftData', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Daft.ie</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.min2Sales === true}
              onChange={(e) => handleChange('min2Sales', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Min 2 sales</span>
          </label>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {propertiesCount.toLocaleString()} properties
        </p>
      </div>
    );
  }

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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.min2Sales === true}
              onChange={(e) => handleChange('min2Sales', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Min 2 sales</span>
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

