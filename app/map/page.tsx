'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useLogRenderTime } from '@/lib/useLogRenderTime';
import MapFiltersBar from '@/components/Filters/MapFiltersBar';
import MapListSwitchBar from '@/components/MapListSwitchBar';
import MapPropertyCard from '@/components/PropertyCard/MapPropertyCard';
import type { PropertyListItem } from '@/lib/api';

const SearchMap = dynamic(() => import('@/components/Map/SearchMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

const LIST_PAGE_SIZE = 100;

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'date_desc';

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
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
  const [propertiesCount, setPropertiesCount] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>('default');

  const [viewport, setViewport] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [listItems, setListItems] = useState<PropertyListItem[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const listAbortRef = useRef<AbortController | null>(null);
  const viewportDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const VIEWPORT_DEBOUNCE_MS = 400;
  const { markRenderStart: markListRenderStart } = useLogRenderTime('Map list', [listItems, listTotal]);

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

  const loadList = useCallback(async (bounds: { north: number; south: number; east: number; west: number }, page: number) => {
    if (listAbortRef.current) listAbortRef.current.abort();
    listAbortRef.current = new AbortController();
    setListLoading(true);
    try {
      const res = await api.getPropertiesInViewport({
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
        page,
        page_size: LIST_PAGE_SIZE,
        county: filters.county,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        has_geocoding: filters.hasGeocoding,
        has_daft_data: filters.hasDaftData,
        min_sales: filters.min2Sales ? 2 : undefined,
        start_date: filters.startDate,
        end_date: filters.endDate,
      }, listAbortRef.current.signal);
      markListRenderStart();
      setListItems(res.items);
      setListTotal(res.total);
      setListPage(page);
    } catch (e) {
      const err = e as { name?: string; code?: string };
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        setListItems([]);
        setListTotal(0);
      }
    } finally {
      setListLoading(false);
      listAbortRef.current = null;
    }
  }, [filters.county, filters.minPrice, filters.maxPrice, filters.hasGeocoding, filters.hasDaftData, filters.min2Sales, filters.startDate, filters.endDate, markListRenderStart]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const p = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    if (viewport) {
      loadList(viewport, p);
    } else {
      setListItems([]);
      setListTotal(0);
      setListPage(1);
    }
    return () => {
      if (listAbortRef.current) listAbortRef.current.abort();
    };
  }, [viewport, loadList, searchParams.get('page')]);

  const handleViewportChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
    viewportDebounceRef.current = setTimeout(() => {
      viewportDebounceRef.current = null;
      setViewport(bounds);
      setListPage(1);
      const page = searchParams.get('page');
      if (page && page !== '1') {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        const target = params.toString() ? `/map?${params.toString()}` : '/map';
        router.replace(target, { scroll: false });
      }
    }, VIEWPORT_DEBOUNCE_MS);
  }, [router, searchParams]);

  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
    };
  }, []);

  // Sync filters/query to URL only when they actually differ (avoid replace loop / repeated GETs)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (filters.county) params.set('county', filters.county);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.hasGeocoding !== undefined) params.set('hasGeocoding', filters.hasGeocoding.toString());
    if (filters.hasDaftData !== undefined) params.set('hasDaftData', filters.hasDaftData.toString());
    if (filters.min2Sales) params.set('min2Sales', 'true');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    const page = searchParams.get('page');
    if (page && page !== '1') params.set('page', page);
    const desiredSearch = params.toString();
    const currentSearch = typeof window !== 'undefined' ? window.location.search.slice(1) : '';
    const norm = (s: string) => [...new URLSearchParams(s).entries()].sort((a, b) => a[0].localeCompare(b[0])).join('&');
    if (norm(desiredSearch) !== norm(currentSearch)) {
      router.replace(desiredSearch ? `/map?${desiredSearch}` : '/map', { scroll: false });
    }
  }, [query, filters.startDate, filters.endDate, filters.county, filters.minPrice, filters.maxPrice, filters.hasGeocoding, filters.hasDaftData, filters.min2Sales, router, searchParams]);

  const totalPages = Math.max(1, Math.ceil(listTotal / LIST_PAGE_SIZE));
  const currentPage = Math.min(listPage, totalPages);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete('page'); else params.set('page', String(p));
    router.replace(params.toString() ? `?${params.toString()}` : '/map', { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAutocompleteSuggestions([]);
    const q = query.toLowerCase();
    const match = counties.find(c => c.toLowerCase().includes(q) || q.includes(c.toLowerCase()));
    if (match) setFilters(prev => ({ ...prev, county: match }));
  };

  const sortedItems = [...listItems];
  if (sort === 'price_asc') sortedItems.sort((a, b) => (a.latest_price ?? 0) - (b.latest_price ?? 0));
  if (sort === 'price_desc') sortedItems.sort((a, b) => (b.latest_price ?? 0) - (a.latest_price ?? 0));
  if (sort === 'date_desc') sortedItems.sort((a, b) => (b.latest_sale_date ?? '').localeCompare(a.latest_sale_date ?? ''));

  const searchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.county) params.set('county', filters.county);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.hasGeocoding !== undefined) params.set('hasGeocoding', filters.hasGeocoding.toString());
    if (filters.hasDaftData !== undefined) params.set('hasDaftData', filters.hasDaftData.toString());
    if (filters.min2Sales) params.set('min2Sales', 'true');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    return params.toString() ? `/search?${params.toString()}` : '/search';
  }, [filters]);

  const mapHref = useMemo(() => {
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

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Full-width header - Zillow-style search + filters */}
      <MapFiltersBar
        searchQuery={query}
        onSearchChange={setQuery}
        onSearchSubmit={handleSearch}
        county={filters.county ?? ''}
        counties={counties}
        onCountyChange={(c) => setFilters(prev => ({ ...prev, county: c || undefined }))}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onPriceChange={(min, max) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
        startDate={filters.startDate ?? '2010-01-01'}
        endDate={filters.endDate ?? '2026-12-31'}
        onDateChange={(start, end) => setFilters(prev => ({ ...prev, startDate: start, endDate: end }))}
        min2Sales={filters.min2Sales}
        onMin2SalesChange={(v) => setFilters(prev => ({ ...prev, min2Sales: v }))}
        placeholder="Address, neighborhood, city, county"
      />

      {/* Two columns on desktop; full map on mobile */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Map: full width on mobile, 70% on desktop */}
        <div className="w-full md:w-[70%] min-w-0 h-full relative">
          <SearchMap
            searchQuery={query}
            filters={filters}
            viewport={viewport}
            fetchPropertyDetails={(id) => api.getProperty(id)}
            onPointsCountChange={setPropertiesCount}
            onViewportChange={handleViewportChange}
            showMapLoadingOverlay={false}
            onPointsLoadingChange={setPointsLoading}
          />
          {/* Mobile: rendered vs total in viewport (with filters) – top left */}
          <div
            className="absolute top-4 left-4 z-[900] md:hidden rounded-lg bg-gray-800/90 dark:bg-gray-700/95 backdrop-blur px-4 py-2.5 shadow-lg border border-gray-700/50"
            aria-live="polite"
            aria-label={`${propertiesCount.toLocaleString()} of ${listTotal.toLocaleString()} properties in this area`}
          >
            <span className="text-sm font-medium text-white tabular-nums">
              {listLoading && listTotal === 0 ? (
                '—'
              ) : (
                `${propertiesCount.toLocaleString()} of ${listTotal.toLocaleString()}`
              )}
            </span>
          </div>
        </div>

        {/* Right sidebar: results list - hidden on mobile, 30% on desktop */}
        <aside className="hidden md:flex w-[30%] min-w-[280px] max-w-[420px] h-full flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Results header */}
          <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ireland Real Estate & Homes For Sale
            </h2>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {listLoading || pointsLoading
                  ? (listLoading && listItems.length === 0 ? 'Loading...' : 'Updating...')
                  : `${listTotal.toLocaleString()} results`}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort"
              >
                <option value="default">Homes for you</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_desc">Newest first</option>
              </select>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto relative">
            {(listLoading || pointsLoading) && listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading map data...</p>
              </div>
            ) : (
              <>
                {(listLoading || pointsLoading) && listItems.length > 0 && (
                  <div className="sticky top-0 z-10 flex items-center justify-center gap-2 py-2 bg-blue-50/90 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Updating...</span>
                  </div>
                )}
              <div className="p-3 space-y-2">
                {sortedItems.map((item) => (
                  <MapPropertyCard key={item.id} property={item} />
                ))}
              </div>
              </>
            )}
            {!listLoading && listTotal > LIST_PAGE_SIZE && (
              <div className="sticky bottom-0 px-4 py-3 flex items-center justify-between gap-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile: List | Map switch bar */}
      <MapListSwitchBar
        activeView="map"
        listHref={searchHref}
        mapHref={mapHref}
      />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
