'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MapFilters from '@/components/Filters/MapFilters';
import AnalysisModeSelector, { AnalysisMode } from '@/components/MapAnalysis/AnalysisModeSelector';
import { api } from '@/lib/api';

// Dynamically import map to avoid SSR issues
const PropertyMap = dynamic(() => import('@/components/Map/PropertyMap'), {
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

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize state from URL parameters
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(
    (searchParams.get('analysisMode') as AnalysisMode) || 'spatial-patterns'
  );
  const [spatialPatternType, setSpatialPatternType] = useState<string>(
    searchParams.get('patternType') || 'Density'
  );
  const [hotspotControls, setHotspotControls] = useState({
    radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50,
    intensity: searchParams.get('intensity') ? parseFloat(searchParams.get('intensity')!) : 0.5,
  });
  
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
  }>({
    county: searchParams.get('county') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    hasGeocoding: searchParams.get('hasGeocoding') === 'true' ? true : searchParams.get('hasGeocoding') === 'false' ? false : undefined,
    hasDaftData: searchParams.get('hasDaftData') === 'true' ? true : searchParams.get('hasDaftData') === 'false' ? false : undefined,
  });
  
  const [counties, setCounties] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [propertiesCount, setPropertiesCount] = useState(0);

  useEffect(() => {
    // Load counties on mount - use fallback if API fails
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

  // Update URL when filters or analysis settings change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (analysisMode !== 'spatial-patterns') {
      params.set('analysisMode', analysisMode);
    }
    
    if (spatialPatternType !== 'Density') {
      params.set('patternType', spatialPatternType);
    }
    
    if (hotspotControls.radius !== 50) {
      params.set('radius', hotspotControls.radius.toString());
    }
    
    if (hotspotControls.intensity !== 0.5) {
      params.set('intensity', hotspotControls.intensity.toString());
    }
    
    if (filters.county) {
      params.set('county', filters.county);
    }
    
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
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
    
    // Update URL without causing a page reload
    const newUrl = params.toString() ? `?${params.toString()}` : '/map';
    router.replace(newUrl, { scroll: false });
  }, [analysisMode, spatialPatternType, hotspotControls, filters, router]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Full Screen Map */}
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <PropertyMap
          analysisMode={analysisMode}
          spatialPatternType={spatialPatternType}
          hotspotControls={hotspotControls}
          filters={filters}
          onPropertiesCountChange={setPropertiesCount}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Map Analysis</h2>
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
              {/* Filters Section */}
              <MapFilters 
                filters={filters} 
                onFilterChange={(newFilters) => setFilters(newFilters)} 
                counties={counties}
                propertiesCount={propertiesCount}
              />
              
              {/* Analysis Mode Selector */}
              <AnalysisModeSelector
                mode={analysisMode}
                onChange={setAnalysisMode}
                spatialPatternType={spatialPatternType}
                onSpatialPatternChange={setSpatialPatternType}
                hotspotControls={hotspotControls}
                onHotspotControlsChange={(controls) => setHotspotControls({ 
                  radius: controls.radius ?? hotspotControls.radius, 
                  intensity: controls.intensity ?? hotspotControls.intensity 
                })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
