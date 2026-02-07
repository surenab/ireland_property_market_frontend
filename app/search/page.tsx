'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLogRenderTime } from '@/lib/useLogRenderTime';
import MapFilters from '@/components/Filters/MapFilters';
import MapListSwitchBar from '@/components/MapListSwitchBar';
import PropertyCard from '@/components/PropertyCard/PropertyCard';
import type { PropertyListItem } from '@/lib/api';

const PAGE_SIZE = 45;

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'date_desc';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sort, setSort] = useState<SortOption>(() => {
    const s = searchParams.get('sort');
    return (s === 'price_asc' || s === 'price_desc' || s === 'date_desc' ? s : 'default') as SortOption;
  });
  const [filters, setFilters] = useState<{
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    min2Sales?: boolean;
    startDate?: string;
    endDate?: string;
  }>({
    county: searchParams.get('county') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    hasGeocoding: searchParams.get('hasGeocoding') === 'true' ? true : searchParams.get('hasGeocoding') === 'false' ? false : undefined,
    hasDaftData: searchParams.get('hasDaftData') === 'true' ? true : searchParams.get('hasDaftData') === 'false' ? false : undefined,
    min2Sales: searchParams.get('min2Sales') === 'true',
    startDate: searchParams.get('startDate') || '2010-01-01',
    endDate: searchParams.get('endDate') || '2026-12-31',
  });
  const [counties, setCounties] = useState<string[]>([]);
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { markRenderStart: markSearchRenderStart } = useLogRenderTime('Search list', [items, total]);

  useEffect(() => {
    const fetchCounties = async () => {
      try {
        const list = await api.listCounties();
        setCounties(list);
      } catch {
        setCounties([
          'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Wexford',
          'Wicklow', 'Kildare', 'Meath', 'Louth', 'Donegal', 'Kerry',
          'Mayo', 'Tipperary', 'Clare', 'Kilkenny', 'Westmeath', 'Laois',
          'Offaly', 'Cavan', 'Sligo', 'Roscommon', 'Monaghan', 'Carlow',
          'Longford', 'Leitrim'
        ]);
      }
    };
    fetchCounties();
  }, []);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const p = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    setPage(p);
  }, [searchParams]);

  useEffect(() => {
    const s = searchParams.get('sort');
    setSort((s === 'price_asc' || s === 'price_desc' || s === 'date_desc' ? s : 'default') as SortOption);
  }, [searchParams.get('sort')]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.county) params.set('county', filters.county);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.hasGeocoding !== undefined) params.set('hasGeocoding', filters.hasGeocoding.toString());
    if (filters.hasDaftData !== undefined) params.set('hasDaftData', filters.hasDaftData.toString());
    if (filters.min2Sales) params.set('min2Sales', 'true');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (sort && sort !== 'default') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    router.replace(params.toString() ? `?${params.toString()}` : '/search', { scroll: false });
  }, [filters, page, sort, router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getProperties({
      page,
      page_size: PAGE_SIZE,
      county: filters.county,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      has_geocoding: filters.hasGeocoding,
      has_daft_data: filters.hasDaftData,
      min_sales: filters.min2Sales ? 2 : undefined,
      sort: sort !== 'default' ? sort : undefined,
      start_date: filters.startDate,
      end_date: filters.endDate,
    })
      .then((res) => {
        if (!cancelled) {
          markSearchRenderStart();
          setItems(res.items);
          setTotal(res.total);
          setTotalPages(res.total_pages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, sort, filters.county, filters.minPrice, filters.maxPrice, filters.hasGeocoding, filters.hasDaftData, filters.min2Sales, filters.startDate, filters.endDate]);

  const mapHref = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.county) params.set('county', filters.county);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.hasGeocoding !== undefined) params.set('hasGeocoding', filters.hasGeocoding.toString());
    if (filters.hasDaftData !== undefined) params.set('hasDaftData', filters.hasDaftData.toString());
    if (filters.min2Sales) params.set('min2Sales', 'true');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    return params.toString() ? `/map?${params.toString()}` : '/map';
  }, [filters]);

  const listHref = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.county) params.set('county', filters.county);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.hasGeocoding !== undefined) params.set('hasGeocoding', filters.hasGeocoding.toString());
    if (filters.hasDaftData !== undefined) params.set('hasDaftData', filters.hasDaftData.toString());
    if (filters.min2Sales) params.set('min2Sales', 'true');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (sort && sort !== 'default') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    return params.toString() ? `/search?${params.toString()}` : '/search';
  }, [filters, page, sort]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0 flex flex-col">
      <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full">
        {/* Left: filters – 25% on desktop; hidden on mobile (filters in collapsible bar) */}
        <aside className="hidden md:block md:w-1/4 md:max-w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="p-4 md:sticky md:top-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            <MapFilters
              filters={filters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
              counties={counties}
              propertiesCount={total}
            />
          </div>
        </aside>
        {/* Right: list (full width on mobile with Filters bar) */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Mobile: sticky bar with count, Sort, Filters button + collapsible filter panel (like heatmap) */}
          <div className="md:hidden shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate min-w-0">
                {loading ? '…' : `${total.toLocaleString()} properties`}
              </span>
              <select
                value={sort}
                onChange={(e) => {
                  const v = e.target.value as SortOption;
                  setSort(v);
                  setPage(1);
                }}
                className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort by"
              >
                <option value="default">Relevance</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="date_desc">Newest</option>
              </select>
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
                  onFilterChange={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                  }}
                  counties={counties}
                  propertiesCount={total}
                />
              </div>
            )}
          </div>
          {/* Desktop: header with count + sort */}
          <div className="hidden md:block px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : `${total.toLocaleString()} properties`}
              </h1>
              <select
                value={sort}
                onChange={(e) => {
                  const v = e.target.value as SortOption;
                  setSort(v);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort by"
              >
                <option value="default">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_desc">Newest first</option>
              </select>
            </div>
          </div>
          <div className="flex-1 px-4 py-4 overflow-auto relative min-h-[200px]">
            {loading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/85 dark:bg-gray-900/85 transition-opacity"
                aria-hidden="true"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Loading…
                  </span>
                </div>
              </div>
            )}
            {!loading && items.length === 0 ? (
              <div className="flex justify-center py-16 text-gray-500 dark:text-gray-400">
                No properties found.
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr transition-opacity duration-200 ${
                    loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {items.map((item) => (
                    <div key={item.id} className="min-h-[220px] flex">
                      <PropertyCard property={item} />
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div
                    className={`mt-8 flex items-center justify-center gap-4 transition-opacity duration-200 ${
                      loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (page <= 2) params.delete('page'); else params.set('page', String(page - 1));
                        router.push(params.toString() ? `/search?${params.toString()}` : '/search');
                      }}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('page', String(page + 1));
                        router.push(`/search?${params.toString()}`);
                      }}
                      disabled={page >= totalPages}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile: List | Map switch bar */}
      <MapListSwitchBar
        activeView="list"
        listHref={listHref()}
        mapHref={mapHref()}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
