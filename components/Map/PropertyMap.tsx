'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnalysisMode } from '@/components/MapAnalysis/AnalysisModeSelector';

// @ts-ignore - leaflet.heat doesn't have types
import 'leaflet.heat';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  analysisMode: AnalysisMode;
  spatialPatternType?: string;
  hotspotControls?: {
    radius?: number;
    intensity?: number;
  };
  filters?: {
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
  };
  onPropertiesCountChange?: (count: number) => void;
}

interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
  data?: any;
}

function MapVisualization({ 
  bounds, 
  analysisMode, 
  spatialPatternType,
  hotspotControls,
  filters,
  onPropertiesCountChange
}: { 
  bounds: L.LatLngBounds | null; 
  analysisMode: AnalysisMode;
  spatialPatternType?: string;
  hotspotControls?: { radius?: number; intensity?: number };
  filters?: PropertyMapProps['filters'];
  onPropertiesCountChange?: (count: number) => void;
}) {
  const map = useMap();
  const [heatmapLayer, setHeatmapLayer] = useState<L.HeatLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoverData, setHoverData] = useState<{ lat: number; lng: number; data: any } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const heatmapDataRef = useRef<HeatmapData[]>([]);
  const lastRequestKeyRef = useRef<string>('');
  const [mapReady, setMapReady] = useState(false);

  // Ensure map is ready before trying to get bounds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const checkMapReady = () => {
      try {
        if (map && map.getBounds && map.getBounds().isValid()) {
          setMapReady(true);
        } else {
          timer = setTimeout(checkMapReady, 100);
        }
      } catch (error) {
        timer = setTimeout(checkMapReady, 100);
      }
    };
    checkMapReady();
    return () => clearTimeout(timer);
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
    } catch (error) {
      // Map not ready yet
      return;
    }

    // Create a stable key from bounds and filters to detect actual changes
    const boundsKey = `${currentBounds.getNorth().toFixed(4)}_${currentBounds.getSouth().toFixed(4)}_${currentBounds.getEast().toFixed(4)}_${currentBounds.getWest().toFixed(4)}`;
    
    // Create a stable key from filters and analysis settings
    const filtersKey = JSON.stringify({
      county: filters?.county,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      hasGeocoding: filters?.hasGeocoding,
      hasDaftData: filters?.hasDaftData,
      analysisMode,
      spatialPatternType,
      radius: hotspotControls?.radius,
      intensity: hotspotControls?.intensity,
    });

    const requestKey = `${boundsKey}_${filtersKey}`;
    
    // Skip if this exact request was already made
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;

    const loadMapData = async () => {
      setLoading(true);
      // Keep the old heatmap layer visible while loading new data
      const oldHeatmapLayer = heatmapLayer;
      
      try {
        const north = currentBounds.getNorth();
        const south = currentBounds.getSouth();
        const east = currentBounds.getEast();
        const west = currentBounds.getWest();

        // Build query params
        const params: Record<string, string | number> = {
          north,
          south,
          east,
          west,
          analysis_mode: analysisMode,
        };

        if (filters?.county) params.county = filters.county;
        if (filters?.startDate) params.start_date = filters.startDate;
        if (filters?.endDate) params.end_date = filters.endDate;
        if (filters?.minPrice) params.min_price = filters.minPrice;
        if (filters?.maxPrice) params.max_price = filters.maxPrice;
        if (filters?.hasGeocoding !== undefined) params.has_geocoding = String(filters.hasGeocoding);
        if (filters?.hasDaftData !== undefined) params.has_daft_data = String(filters.hasDaftData);
        if (spatialPatternType) params.pattern_type = spatialPatternType;
        if (hotspotControls?.radius) params.radius = hotspotControls.radius;
        if (hotspotControls?.intensity) params.intensity = hotspotControls.intensity;

        // Call appropriate API endpoint based on analysis mode
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://clownfish-app-bthm6.ondigitalocean.app';
        const response = await fetch(
          `${apiUrl}/api/map/analysis?${new URLSearchParams(params as Record<string, string>)}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        // Report property count to parent
        if (onPropertiesCountChange && data.total_properties !== undefined) {
          onPropertiesCountChange(data.total_properties);
        }

        // Process data based on analysis mode
        if (data.heatmap_data && data.heatmap_data.length > 0) {
          // Store heatmap data for hover tooltips
          heatmapDataRef.current = data.heatmap_data;
          
          // Create heatmap layer with more visible colors
          const heatmapPoints: [number, number, number][] = data.heatmap_data.map((point: HeatmapData) => [
            point.lat,
            point.lng,
            point.intensity || 1
          ]);

          // Use different gradient for growth-decline mode
          const isGrowthDecline = analysisMode === 'growth-decline';
          const gradient = isGrowthDecline ? {
            // Growth-decline: red (decline) -> yellow (neutral) -> green (growth)
            0.0: '#FF0000',  // Red (decline)
            0.25: '#FF6600', // Orange-red
            0.5: '#FFFF00',  // Yellow (neutral)
            0.75: '#66FF00', // Yellow-green
            1.0: '#00FF00'   // Green (growth)
          } : {
            // Default gradient for other modes
            0.0: '#0000FF',  // Bright blue
            0.2: '#00FFFF',  // Cyan
            0.4: '#00FF00',  // Bright green
            0.6: '#FFFF00',  // Bright yellow
            0.8: '#FF8000',  // Orange
            1.0: '#FF0000'   // Bright red
          };

          const newHeatmapLayer = (L as any).heatLayer(heatmapPoints, {
            radius: hotspotControls?.radius || 50,
            blur: 15,
            maxZoom: 18,
            gradient: gradient,
            minOpacity: 0.15   // Make it more visible
          });

          // Add new layer first
          newHeatmapLayer.addTo(map);
          setHeatmapLayer(newHeatmapLayer);
          
          // Remove old heatmap layer only after new one is successfully added
          if (oldHeatmapLayer) {
            map.removeLayer(oldHeatmapLayer);
          }

          // Add mouse move event to show tooltip
          const handleMouseMove = (e: L.LeafletMouseEvent) => {
            const mouseLat = e.latlng.lat;
            const mouseLng = e.latlng.lng;
            
            // Find the closest heatmap point within a reasonable distance
            let closestPoint: HeatmapData | null = null;
            let minDistance = Infinity;
            const searchRadius = 0.01; // degrees, roughly 1km
            
            for (const point of heatmapDataRef.current) {
              const distance = Math.sqrt(
                Math.pow(point.lat - mouseLat, 2) + Math.pow(point.lng - mouseLng, 2)
              );
              
              if (distance < searchRadius && distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
              }
            }
            
            if (closestPoint) {
              setHoverData({
                lat: closestPoint.lat,
                lng: closestPoint.lng,
                data: closestPoint.data || {}
              });
              
              // Convert lat/lng to pixel coordinates for tooltip positioning
              const containerPoint = map.latLngToContainerPoint(e.latlng);
              setTooltipPosition({
                x: containerPoint.x,
                y: containerPoint.y
              });
            } else {
              setHoverData(null);
              setTooltipPosition(null);
            }
          };

          const handleMouseOut = () => {
            setHoverData(null);
            setTooltipPosition(null);
          };

          map.on('mousemove', handleMouseMove);
          map.on('mouseout', handleMouseOut);

          // Cleanup function
          return () => {
            map.off('mousemove', handleMouseMove);
            map.off('mouseout', handleMouseOut);
          };
        } else {
          // No new heatmap data - remove old layer if it exists
          if (oldHeatmapLayer) {
            map.removeLayer(oldHeatmapLayer);
            setHeatmapLayer(null);
          }
          heatmapDataRef.current = [];
        }

        // Map is for statistical analysis only - no individual property markers
        // Only show heatmaps and cluster visualizations

      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls - only call after user stops moving/zooming
    const timeoutId = setTimeout(loadMapData, 500);
    
    return () => {
      clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [mapReady, bounds, analysisMode, spatialPatternType, hotspotControls?.radius, hotspotControls?.intensity, filters?.county, filters?.startDate, filters?.endDate, filters?.minPrice, filters?.maxPrice, filters?.hasGeocoding, filters?.hasDaftData]);

  // Add mouse move event handler for tooltip
  useEffect(() => {
    if (!map || heatmapDataRef.current.length === 0) return;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const mouseLat = e.latlng.lat;
      const mouseLng = e.latlng.lng;
      
      // Find the closest heatmap point within a reasonable distance
      let closestPoint: HeatmapData | null = null;
      let minDistance = Infinity;
      const searchRadius = 0.01; // degrees, roughly 1km
      
      for (const point of heatmapDataRef.current) {
        const distance = Math.sqrt(
          Math.pow(point.lat - mouseLat, 2) + Math.pow(point.lng - mouseLng, 2)
        );
        
        if (distance < searchRadius && distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
      
      if (closestPoint) {
        setHoverData({
          lat: closestPoint.lat,
          lng: closestPoint.lng,
          data: closestPoint.data || {}
        });
        
        // Convert lat/lng to pixel coordinates for tooltip positioning
        const containerPoint = map.latLngToContainerPoint(e.latlng);
        setTooltipPosition({
          x: containerPoint.x,
          y: containerPoint.y
        });
      } else {
        setHoverData(null);
        setTooltipPosition(null);
      }
    };

    const handleMouseOut = () => {
      setHoverData(null);
      setTooltipPosition(null);
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
    };
  }, [map, heatmapDataRef.current.length]);

  return (
    <>
      {loading && (
        <div className="absolute top-4 right-4 z-[999] pointer-events-none">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <div className="text-gray-900 dark:text-white text-sm">Loading map data...</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hover Tooltip */}
      {hoverData && tooltipPosition && (
        <div
          className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-3 z-[1000] pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translateY(-100%)',
            maxWidth: '250px'
          }}
        >
          <div className="text-sm text-gray-900 dark:text-white">
            <div className="font-semibold mb-2">Heatmap Data</div>
            <div className="space-y-1">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Intensity: </span>
                <span className="font-medium">{(hoverData.data.intensity || hoverData.data.intensity === 0) ? hoverData.data.intensity.toFixed(2) : 'N/A'}</span>
              </div>
              {hoverData.data.avg_price && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg Price: </span>
                  <span className="font-medium">€{hoverData.data.avg_price.toLocaleString()}</span>
                </div>
              )}
              {hoverData.data.sales_count !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sales Count: </span>
                  <span className="font-medium">{hoverData.data.sales_count}</span>
                </div>
              )}
              {hoverData.data.price_change !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Price Change: </span>
                  <span className="font-medium">€{hoverData.data.price_change.toLocaleString()}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Lat: {hoverData.lat.toFixed(4)}, Lng: {hoverData.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PropertyMap({ 
  analysisMode, 
  spatialPatternType,
  hotspotControls,
  filters,
  onPropertiesCountChange
}: PropertyMapProps) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const mapRef = useRef<L.Map>(null);

  // Default center: Ireland
  const defaultCenter: [number, number] = [53.41291, -8.24389];
  const defaultZoom = 7;

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
        <MapBoundsUpdater onBoundsChange={setBounds} />
        <MapVisualization 
          bounds={bounds} 
          analysisMode={analysisMode}
          spatialPatternType={spatialPatternType}
          hotspotControls={hotspotControls}
          filters={filters}
          onPropertiesCountChange={onPropertiesCountChange}
        />
      </MapContainer>
    </div>
  );
}

function MapBoundsUpdater({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<string | null>(null);
  const initialBoundsSetRef = useRef(false);

  useEffect(() => {
    // Set initial bounds immediately when map is ready
    if (!initialBoundsSetRef.current && map) {
      const initialBounds = map.getBounds();
      if (initialBounds.isValid()) {
        const boundsKey = `${initialBounds.getNorth().toFixed(4)}_${initialBounds.getSouth().toFixed(4)}_${initialBounds.getEast().toFixed(4)}_${initialBounds.getWest().toFixed(4)}`;
        lastBoundsRef.current = boundsKey;
        onBoundsChange(initialBounds);
        initialBoundsSetRef.current = true;
      }
    }

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

    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChange]);

  return null;
}
