'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { api, MapPoint } from '@/lib/api';

// Fix for default marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SearchMapProps {
  searchQuery?: string;
  filters?: {
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    startDate?: string;
    endDate?: string;
  };
  onPropertyClick?: (propertyId: number) => void;
  onPointsCountChange?: (count: number) => void;
}

function MapPointsUpdater({ 
  bounds, 
  filters,
  searchQuery,
  onPointsUpdate,
  onPointsCountChange,
}: { 
  bounds: L.LatLngBounds | null;
  filters?: SearchMapProps['filters'];
  searchQuery?: string;
  onPointsUpdate: (points: MapPoint[]) => void;
  onPointsCountChange?: (count: number) => void;
}) {
  const map = useMap();
  const lastRequestKeyRef = useRef<string>('');
  const [mapReady, setMapReady] = useState(false);
  const filtersRef = useRef<string>('');

  // Ensure map is ready before trying to get bounds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkMapReady = (): void => {
      try {
        if (map && map.getBounds && map.getBounds().isValid()) {
          setMapReady(true);
        } else {
          // Retry after a short delay if map isn't ready
          timeoutId = setTimeout(checkMapReady, 100);
        }
      } catch {
        // Map not ready yet, retry
        timeoutId = setTimeout(checkMapReady, 100);
      }
    };
    
    checkMapReady();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [map]);

  useEffect(() => {
    // Wait for map to be ready
    if (!mapReady) {
      return;
    }

    // Get bounds - prefer provided bounds, otherwise get from map
    let currentBounds: L.LatLngBounds;
    try {
      if (bounds && bounds.isValid()) {
        currentBounds = bounds;
      } else {
        const mapBounds = map.getBounds();
        if (!mapBounds.isValid()) {
          return;
        }
        currentBounds = mapBounds;
      }
    } catch {
      // Map not ready yet
      return;
    }

    // Create a stable key from bounds and filters to detect actual changes
    const boundsKey = `${currentBounds.getNorth().toFixed(4)}_${currentBounds.getSouth().toFixed(4)}_${currentBounds.getEast().toFixed(4)}_${currentBounds.getWest().toFixed(4)}`;
    
    // Create a stable key from filters and search query
    const filtersKey = JSON.stringify({
      county: filters?.county,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      hasGeocoding: filters?.hasGeocoding,
      hasDaftData: filters?.hasDaftData,
      searchQuery,
    });

    const requestKey = `${boundsKey}_${filtersKey}`;
    
    // Reset request key if filters changed (even if bounds are the same)
    // This ensures we always fetch when filters change
    if (filtersRef.current !== filtersKey) {
      filtersRef.current = filtersKey;
      lastRequestKeyRef.current = ''; // Reset to force new request
    }
    
    // Skip if this exact request was already made
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;

    const loadMapData = async () => {
      try {
        const north = currentBounds.getNorth();
        const south = currentBounds.getSouth();
        const east = currentBounds.getEast();
        const west = currentBounds.getWest();

        // Always fetch individual points - Leaflet will handle clustering automatically
        const response = await api.getMapPoints({
          north,
          south,
          east,
          west,
          max_points: 1500000, // Increased limit since clustering handles performance
          county: filters?.county,
          min_price: filters?.minPrice,
          max_price: filters?.maxPrice,
          has_geocoding: filters?.hasGeocoding,
          has_daft_data: filters?.hasDaftData,
          start_date: filters?.startDate,
          end_date: filters?.endDate,
        });
        
        onPointsUpdate(response.points);
        if (onPointsCountChange) {
          onPointsCountChange(response.total);
        }

      } catch (error) {
        console.error('Error loading map data:', error);
        onPointsUpdate([]);
        if (onPointsCountChange) {
          onPointsCountChange(0);
        }
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(loadMapData, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
    // Include filters object and searchQuery in dependencies to ensure updates when they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, bounds, filters, searchQuery]);

  return null;
}

function MapBoundsUpdater({ 
  onBoundsChange
}: { 
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    const updateBounds = () => {
      // Debounce bounds updates to avoid excessive API calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const currentBounds = map.getBounds();
        
        if (currentBounds.isValid()) {
          // Create a stable key to detect actual changes
          const boundsKey = `${currentBounds.getNorth().toFixed(4)}_${currentBounds.getSouth().toFixed(4)}_${currentBounds.getEast().toFixed(4)}_${currentBounds.getWest().toFixed(4)}`;
          
          // Only update if bounds actually changed
          if (lastBoundsRef.current !== boundsKey) {
            lastBoundsRef.current = boundsKey;
            onBoundsChange(currentBounds);
          }
        }
      }, 500);
    };

    const handleMoveEnd = () => updateBounds();
    const handleZoomEnd = () => updateBounds();

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);
    
    // Set initial bounds immediately (no debounce for initial load)
    const setInitialBounds = (): void => {
      try {
        const initialBounds = map.getBounds();
        
        if (initialBounds.isValid()) {
          const boundsKey = `${initialBounds.getNorth().toFixed(4)}_${initialBounds.getSouth().toFixed(4)}_${initialBounds.getEast().toFixed(4)}_${initialBounds.getWest().toFixed(4)}`;
          if (lastBoundsRef.current !== boundsKey) {
            lastBoundsRef.current = boundsKey;
            onBoundsChange(initialBounds);
          }
        } else {
          // Retry if map not ready yet
          setTimeout(setInitialBounds, 100);
          return;
        }
      } catch {
        // Retry if map not ready yet
        setTimeout(setInitialBounds, 100);
      }
    };
    
    // Try to set initial bounds
    setInitialBounds();
    
    // Also set when map is ready
    map.whenReady(() => {
      setInitialBounds();
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onBoundsChange]);

  return null;
}

// Component to handle MarkerClusterGroup
function MarkerClusterGroupComponent({ 
  points,
  onPropertyClick
}: { 
  points: MapPoint[];
  onPropertyClick?: (propertyId: number) => void;
}) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Wait for map to be fully ready
  useEffect(() => {
    if (!map) return;

    const checkMapReady = () => {
      try {
        // Check if map is initialized by trying to access its properties
        if (map && typeof map.getZoom === 'function' && typeof map.getBounds === 'function') {
          const bounds = map.getBounds();
          if (bounds && bounds.isValid()) {
            setMapReady(true);
            return;
          }
        }
        setTimeout(checkMapReady, 100);
      } catch {
        setTimeout(checkMapReady, 100);
      }
    };

    // Also use whenReady as a backup
    map.whenReady(() => {
      setMapReady(true);
    });

    checkMapReady();
  }, [map]);

  useEffect(() => {
    if (!map || !mapReady) return;

    // Cleanup existing cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create MarkerClusterGroup with custom icon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clusterGroup = new (L as any).MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
        const sizePx = size === 'small' ? 40 : size === 'medium' ? 50 : 60;
        
        return L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div style="
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              width: ${sizePx}px;
              height: ${sizePx}px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size === 'small' ? '14px' : size === 'medium' ? '16px' : '18px'};
            ">
              ${count}
            </div>
          `,
          iconSize: [sizePx, sizePx],
          iconAnchor: [sizePx / 2, sizePx / 2],
        });
      },
    });

    // Add cluster group to map FIRST, before adding markers
    clusterGroup.addTo(map);
    clusterGroupRef.current = clusterGroup;

    // Add event listener to show tooltip on cluster hover
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clusterGroup.on('clusterclick', function(a: any) {
      const cluster = a.layer;
      const count = cluster.getChildCount();
      cluster.bindTooltip(`${count} ${count === 1 ? 'property' : 'properties'}`, {
        permanent: false,
        direction: 'top',
      }).openTooltip();
    });

    // Add markers to cluster group AFTER it's added to the map
    points.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude]);
      
      // Create popup content
      let popupContent = `<div class="text-sm min-w-[200px]">
        <strong class="block mb-2">${point.address || 'Property'}</strong>`;
      
      if (point.price) {
        popupContent += `<p class="mb-1">
          <span class="font-medium">Price:</span> €${point.price.toLocaleString()}
        </p>`;
      }
      
      if (point.date) {
        try {
          const dateStr = point.date.trim();
          let date: Date;
          
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            date = new Date(year, month - 1, day);
          } else {
            date = new Date(dateStr);
          }
          
          if (!isNaN(date.getTime())) {
            popupContent += `<p class="mb-1">
              <span class="font-medium">Sale Date:</span> ${date.toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>`;
          } else {
            popupContent += `<p class="mb-1">
              <span class="font-medium">Sale Date:</span> ${point.date}
            </p>`;
          }
        } catch {
          popupContent += `<p class="mb-1">
            <span class="font-medium">Sale Date:</span> ${point.date}
          </p>`;
        }
      }
      
      if (point.county) {
        popupContent += `<p class="mb-2">
          <span class="font-medium">County:</span> ${point.county}
        </p>`;
      }
      
      if (onPropertyClick) {
        popupContent += `<button
          onclick="window.open('/property/${point.id}', '_blank', 'noopener,noreferrer')"
          class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
        >
          View Details
        </button>`;
      }
      
      popupContent += '</div>';
      
      marker.bindPopup(popupContent);
      
      // Add tooltip with count for clusters (will be shown when clustered)
      marker.bindTooltip(`${point.address || 'Property'}`, {
        permanent: false,
        direction: 'top',
      });
      
      clusterGroup.addLayer(marker);
    });

    // Cleanup
    return () => {
      if (clusterGroupRef.current) {
        try {
          map.removeLayer(clusterGroupRef.current);
        } catch {
          // Ignore errors during cleanup
        }
        clusterGroupRef.current = null;
      }
    };
  }, [map, mapReady, points, onPropertyClick]);

  return null;
}

export default function SearchMap({ 
  searchQuery,
  filters,
  onPropertyClick,
  onPointsCountChange
}: SearchMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Default center: Ireland
  const defaultCenter: [number, number] = [53.41291, -8.24389];
  const defaultZoom = 7;

  // Ensure component only renders on client side
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ zIndex: 0 }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        ref={mapRef}
        zoomAnimation={true}
        zoomAnimationThreshold={4}
        fadeAnimation={true}
        markerZoomAnimation={true}
        whenReady={() => {
          if (mapRef.current) {
            const initialBounds = mapRef.current.getBounds();
            setBounds(initialBounds);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater 
          onBoundsChange={setBounds}
        />
        <MapPointsUpdater 
          bounds={bounds}
          filters={filters}
          searchQuery={searchQuery}
          onPointsUpdate={setPoints}
          onPointsCountChange={onPointsCountChange}
        />
        
        {/* Use MarkerClusterGroup for automatic clustering */}
        <MarkerClusterGroupComponent 
          points={points}
          onPropertyClick={onPropertyClick}
        />
      </MapContainer>
    </div>
  );
}

