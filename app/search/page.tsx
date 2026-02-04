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
  const [showControls, setShowControls] = useState(true);
  const [propertiesCount, setPropertiesCount] = useState<number>(0);

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

      {/* Overlay Controls - Top Left */}
      <div 
        className="absolute top-4 left-4 max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{ zIndex: 1000, pointerEvents: 'auto' }}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Toggle Button */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search Properties</h2>
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle controls"
            >
              {showControls ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
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
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => {
                      setTimeout(() => setAutocompleteSuggestions([]), 200);
                    }}
                    placeholder="Search by address, eircode, or county..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-24 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Search
                  </button>

                  {/* Autocomplete Suggestions */}
                  {autocompleteSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {autocompleteSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => {
                            setQuery(suggestion);
                            setAutocompleteSuggestions([]);
                            // Auto-search when clicking a suggestion
                            const queryLower = suggestion.toLowerCase();
                            const matchingCounty = counties.find(c => c.toLowerCase().includes(queryLower) || queryLower.includes(c.toLowerCase()));
                            if (matchingCounty) {
                              setFilters(prev => ({ ...prev, county: matchingCounty }));
                            }
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </form>

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
