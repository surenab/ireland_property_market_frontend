'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import MapFilters from '@/components/Filters/MapFilters';

// Dynamically import search map to avoid SSR issues
const SearchMap = dynamic(() => import('@/components/Map/SearchMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize state from URL parameters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    startDate?: string;
    endDate?: string;
  }>({
    county: searchParams.get('county') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    hasGeocoding: searchParams.get('hasGeocoding') === 'true' ? true : searchParams.get('hasGeocoding') === 'false' ? false : undefined,
    hasDaftData: searchParams.get('hasDaftData') === 'true' ? true : searchParams.get('hasDaftData') === 'false' ? false : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  });
  const [counties, setCounties] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false); // Start collapsed on mobile
  const [propertiesCount, setPropertiesCount] = useState<number>(0);
  
  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setShowControls(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load counties on mount
    const fetchCounties = async () => {
      try {
        const countiesList = await api.listCounties();
        setCounties(countiesList);
      } catch (error) {
        console.error('Error loading counties:', error);
        // Fallback: use common Irish counties if API fails
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

  const loadAutocomplete = useCallback(async () => {
    try {
      const suggestions = await api.autocomplete({ q: query, limit: 10 });
      setAutocompleteSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading autocomplete:', error);
    }
  }, [query]);

  useEffect(() => {
    // Load autocomplete suggestions as user types
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        loadAutocomplete();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setAutocompleteSuggestions([]);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [query, loadAutocomplete]);

  // Update URL when filters or query change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.set('q', query.trim());
    }
    
    if (filters.county) {
      params.set('county', filters.county);
    }
    
    if (filters.minPrice !== undefined) {
      params.set('minPrice', filters.minPrice.toString());
    }
    
    if (filters.maxPrice !== undefined) {
      params.set('maxPrice', filters.maxPrice.toString());
    }
    
    if (filters.hasGeocoding !== undefined) {
      params.set('hasGeocoding', filters.hasGeocoding.toString());
    }
    
    if (filters.hasDaftData !== undefined) {
      params.set('hasDaftData', filters.hasDaftData.toString());
    }
    
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }
    
    // Update URL without causing a page reload
    const newUrl = params.toString() ? `?${params.toString()}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [query, filters, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Close autocomplete dropdown when searching
    setAutocompleteSuggestions([]);
    
    // If query looks like a county, set it as county filter
    const queryLower = query.toLowerCase();
    const matchingCounty = counties.find(c => c.toLowerCase().includes(queryLower) || queryLower.includes(c.toLowerCase()));
    if (matchingCounty) {
      setFilters(prev => ({ ...prev, county: matchingCounty }));
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Full Screen Map */}
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <SearchMap
          searchQuery={query}
          filters={filters}
          onPropertyClick={(id) => {
            window.open(`/property/${id}`, '_blank', 'noopener,noreferrer');
          }}
          onPointsCountChange={setPropertiesCount}
        />
      </div>

      {/* Mobile: Backdrop overlay */}
      {showControls && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 sm:hidden z-40 transition-opacity"
          onClick={() => setShowControls(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Mobile: Floating Toggle Button (when collapsed) */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden z-50 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 font-medium transition-all"
          aria-label="Show filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search & Filters</span>
        </button>
      )}

      {/* Overlay Controls - Mobile bottom sheet, Desktop top-left */}
      <div 
        className={`fixed sm:absolute ${
          showControls 
            ? 'bottom-0 sm:top-4 sm:bottom-auto' 
            : '-bottom-full sm:top-4 sm:bottom-auto'
        } left-0 right-0 sm:left-4 sm:right-auto sm:max-w-md w-full sm:w-auto transition-all duration-300 ease-in-out z-50 sm:z-[1000]`}
        style={{ pointerEvents: 'auto', maxHeight: '85vh' }}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto h-full"
          style={{ pointerEvents: 'auto', maxHeight: 'inherit' }}
        >
          {/* Mobile: Drag Handle */}
          <div className="sm:hidden flex justify-center mb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Search Properties</h2>
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle controls"
            >
              {showControls ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          {showControls && (
            <>
              {/* Filters Section */}
              <MapFilters 
                filters={filters} 
                onFilterChange={(newFilters) => setFilters(newFilters)} 
                counties={counties}
                propertiesCount={propertiesCount}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
