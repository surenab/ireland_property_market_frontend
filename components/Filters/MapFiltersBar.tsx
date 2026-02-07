'use client';

import { useState } from 'react';

interface MapFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  county: string;
  counties: string[];
  onCountyChange: (county: string | undefined) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min?: number, max?: number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  min2Sales?: boolean;
  onMin2SalesChange?: (value: boolean) => void;
  placeholder?: string;
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

export default function MapFiltersBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  county,
  counties,
  onCountyChange,
  minPrice,
  maxPrice,
  onPriceChange,
  startDate,
  endDate,
  onDateChange,
  min2Sales,
  onMin2SalesChange,
  placeholder = 'Address, neighborhood, city, county',
}: MapFiltersBarProps) {
  const START_YEAR = 2010;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);
  const minYearValue = startDate ? parseInt(startDate.slice(0, 4), 10) : START_YEAR;
  const maxYearValue = endDate ? parseInt(endDate.slice(0, 4), 10) : currentYear;

  const [filtersOpen, setFiltersOpen] = useState(false);

  const inputBase = 'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const inputCompact = 'py-2 px-2.5 md:py-2.5 md:px-3';

  return (
    <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:flex-wrap md:items-center md:gap-2 md:px-4 md:py-3">
        {/* Row 1: search + Filters toggle on mobile */}
        <form onSubmit={onSearchSubmit} className="flex w-full min-w-0 gap-2 md:flex-1 md:min-w-[200px] md:max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className={`min-w-0 flex-1 ${inputBase} ${inputCompact} placeholder-gray-500`}
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
            aria-expanded={filtersOpen}
            aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
          >
            {filtersOpen ? 'Done' : 'Filters'}
          </button>
        </form>
        {/* County, price, year: collapsible on mobile; always visible on desktop */}
        <div className={`flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2 ${filtersOpen ? 'flex' : 'hidden md:flex'}`}>
          <select
            value={county || ''}
            onChange={(e) => onCountyChange(e.target.value || undefined)}
            className={`w-full ${inputBase} ${inputCompact} md:w-auto`}
            aria-label="County"
          >
            <option value="">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex w-full items-center gap-1.5 md:w-auto">
            <label className="sr-only" htmlFor="filter-min-price">Min price (€)</label>
            <input
              id="filter-min-price"
              type="text"
              inputMode="numeric"
              placeholder="Min €"
              value={formatPriceForInput(minPrice)}
              onChange={(e) => {
                const v = parsePriceInput(e.target.value);
                if (v !== undefined && maxPrice !== undefined && v > maxPrice)
                  onPriceChange(v, v);
                else
                  onPriceChange(v, maxPrice);
              }}
              className={`min-w-0 flex-1 ${inputBase} ${inputCompact} placeholder-gray-400 md:w-24 md:flex-none`}
              aria-label="Min price (€)"
            />
            <span className="shrink-0 text-gray-500 dark:text-gray-400 text-sm">–</span>
            <label className="sr-only" htmlFor="filter-max-price">Max price (€)</label>
            <input
              id="filter-max-price"
              type="text"
              inputMode="numeric"
              placeholder="Max €"
              value={formatPriceForInput(maxPrice)}
              onChange={(e) => {
                const v = parsePriceInput(e.target.value);
                if (v !== undefined && minPrice !== undefined && v < minPrice)
                  onPriceChange(v, v);
                else
                  onPriceChange(minPrice, v);
              }}
              className={`min-w-0 flex-1 ${inputBase} ${inputCompact} placeholder-gray-400 md:w-24 md:flex-none`}
              aria-label="Max price (€)"
            />
          </div>
          <div className="flex w-full items-center gap-1 md:w-auto">
            <select
              value={Math.min(Math.max(minYearValue, START_YEAR), currentYear)}
              onChange={(e) => {
                const y = e.target.value;
                const newStart = `${y}-01-01`;
                const maxYear = endDate ? parseInt(endDate.slice(0, 4), 10) : currentYear;
                if (parseInt(y, 10) > maxYear)
                  onDateChange(newStart, `${y}-12-31`);
                else
                  onDateChange(newStart, endDate);
              }}
              className={`min-w-0 flex-1 ${inputBase} py-2 px-2 md:flex-none md:py-2.5`}
              aria-label="From year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="shrink-0 text-gray-500 dark:text-gray-400 text-sm">–</span>
            <select
              value={Math.min(Math.max(maxYearValue, START_YEAR), currentYear)}
              onChange={(e) => {
                const y = e.target.value;
                const newEnd = `${y}-12-31`;
                const minYear = startDate ? parseInt(startDate.slice(0, 4), 10) : START_YEAR;
                if (parseInt(y, 10) < minYear)
                  onDateChange(`${y}-01-01`, newEnd);
                else
                  onDateChange(startDate, newEnd);
              }}
              className={`min-w-0 flex-1 ${inputBase} py-2 px-2 md:flex-none md:py-2.5`}
              aria-label="To year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {onMin2SalesChange && (
            <label className="flex w-full cursor-pointer items-center justify-between gap-3 md:w-auto">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Min 2 sales</span>
              <button
                type="button"
                role="switch"
                aria-checked={min2Sales === true}
                onClick={() => onMin2SalesChange(!min2Sales)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
                  min2Sales ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-out ${
                    min2Sales ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
          )}
        </div>
      </div>
    </header>
  );
}
