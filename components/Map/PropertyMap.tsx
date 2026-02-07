'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnalysisMode } from '@/components/MapAnalysis/AnalysisModeSelector';
import MapLoadingOverlay from './MapLoadingOverlay';
import { api } from '@/lib/api';
import MapRequestManager from '@/lib/mapRequestManager';
import { useViewportPrefetch } from '@/lib/useViewportPrefetch';

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
  analysisMode, 
  spatialPatternType,
  hotspotControls,
  filters,
  onPropertiesCountChange,
  onLoadingChange
}: { 
  analysisMode: AnalysisMode;
  spatialPatternType?: string;
  hotspotControls?: { radius?: number; intensity?: number };
  filters?: PropertyMapProps['filters'];
  onPropertiesCountChange?: (count: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const map = useMap();
  const [heatmapLayer, setHeatmapLayer] = useState<L.HeatLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const requestManager = useRef(new MapRequestManager());
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastRequestKey = useRef<string>('');
  const lastZoom = useRef<number | null>(null);
  const [hoverData, setHoverData] = useState<{ lat: number; lng: number; data: any } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const heatmapDataRef = useRef<HeatmapData[]>([]);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  const loadData = useCallback(async (immediate: boolean = false) => {
    if (!map) return;
    
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
    
    const filtersKey = JSON.stringify({
      north,
      south,
      east,
      west,
      zoom,
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
    
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Cancel previous request if viewport changed
    if (lastRequestKey.current !== filtersKey) {
      requestManager.current.cancelRequest(lastRequestKey.current);
    }
    
    const makeRequest = async () => {
      setLoading(true);
      // Keep the old heatmap layer visible while loading new data
      const currentOldLayer = heatmapLayer;
      if (currentOldLayer && currentOldLayer.setOpacity) {
        // Reduce opacity for transition
        currentOldLayer.setOpacity(0.3);
      }
      
      lastRequestKey.current = filtersKey;
      
      try {
        const requestKey = `map_analysis_${filtersKey}`;
        
        const data = await requestManager.current.request(
          requestKey,
          () => api.getMapAnalysis({
            north,
            south,
            east,
            west,
            zoom,
            analysis_mode: analysisMode,
            county: filters?.county,
            start_date: filters?.startDate,
            end_date: filters?.endDate,
            min_price: filters?.minPrice,
            max_price: filters?.maxPrice,
            has_geocoding: filters?.hasGeocoding,
            has_daft_data: filters?.hasDaftData,
            pattern_type: spatialPatternType,
            radius: hotspotControls?.radius,
            intensity: hotspotControls?.intensity,
          }),
          1 // High priority
        );
        
        if (!data) return;
        if (!map?.getContainer?.() || !document.contains(map.getContainer())) return;

        // Report property count to parent
        if (onPropertiesCountChange && data.total_properties !== undefined) {
          onPropertiesCountChange(data.total_properties);
        }

        // Prefer heatmap_polygons when present; otherwise use heatmap_data (points)
        const hasPolygons = data.heatmap_polygons && data.heatmap_polygons.length > 0;
        const hasPoints = data.heatmap_data && data.heatmap_data.length > 0;

        if (hasPolygons) {
          heatmapDataRef.current = [];
          if (currentOldLayer) {
            try {
              map.removeLayer(currentOldLayer);
            } catch {
              // Ignore
            }
            setHeatmapLayer(null);
          }
          if (polygonLayerRef.current) {
            try {
              map.removeLayer(polygonLayerRef.current);
            } catch {
              // Ignore
            }
            polygonLayerRef.current = null;
          }

          startTransition(() => {
            setTimeout(() => {
              if (!map?.getContainer?.() || !document.contains(map.getContainer())) return;
              const isGrowthDecline = analysisMode === 'growth-decline';
              const polygonGroup = L.layerGroup();
              data.heatmap_polygons.forEach((feature: { coordinates: Array<Array<number[]>>; metadata: Record<string, unknown> }) => {
                const ring = feature.coordinates[0];
                if (!ring || ring.length < 3) return;
                const latLngs: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);
                const intensity = Number(feature.metadata?.intensity ?? 0);
                const fillColor = isGrowthDecline
                  ? intensity < 0.5 ? '#FF0000' : intensity < 0.75 ? '#FFFF00' : '#00FF00'
                  : intensity < 0.25 ? '#0000FF' : intensity < 0.5 ? '#00FFFF' : intensity < 0.75 ? '#FFFF00' : '#FF0000';
                const poly = L.polygon(latLngs, {
                  fillColor,
                  fillOpacity: 0.35,
                  color: '#333',
                  weight: 0.5,
                });
                const meta = feature.metadata || {};
                const tip = [
                  meta.sales_count != null && `Sales: ${meta.sales_count}`,
                  meta.avg_price != null && `Avg: €${Number(meta.avg_price).toLocaleString()}`,
                ].filter(Boolean).join(' | ');
                if (tip) poly.bindTooltip(tip, { permanent: false, direction: 'top' });
                polygonGroup.addLayer(poly);
              });
              try {
                polygonGroup.addTo(map);
                polygonLayerRef.current = polygonGroup;
              } catch {
                // Map may have been destroyed (e.g. unmounted)
              }
            }, 0);
          });
        } else if (hasPoints) {
          heatmapDataRef.current = data.heatmap_data;
          if (polygonLayerRef.current) {
            try {
              map.removeLayer(polygonLayerRef.current);
            } catch {
              // Ignore
            }
            polygonLayerRef.current = null;
          }

          startTransition(() => {
            setTimeout(() => {
              if (!map?.getContainer?.() || !document.contains(map.getContainer())) return;
              const heatmapPoints: [number, number, number][] = data.heatmap_data.map((point: HeatmapData) => [
                point.lat,
                point.lng,
                point.intensity || 1
              ]);
              const isGrowthDecline = analysisMode === 'growth-decline';
              const gradient = isGrowthDecline ? {
                0.0: '#FF0000', 0.25: '#FF6600', 0.5: '#FFFF00', 0.75: '#66FF00', 1.0: '#00FF00'
              } : {
                0.0: '#0000FF', 0.2: '#00FFFF', 0.4: '#00FF00', 0.6: '#FFFF00', 0.8: '#FF8000', 1.0: '#FF0000'
              };
              const newHeatmapLayer = (L as any).heatLayer(heatmapPoints, {
                radius: hotspotControls?.radius || 40,
                blur: 25,
                maxZoom: 18,
                gradient,
                minOpacity: 0.05
              });
              try {
                newHeatmapLayer.addTo(map);
                setHeatmapLayer(newHeatmapLayer);
                if (currentOldLayer) {
                  setTimeout(() => {
                    try {
                      map.removeLayer(currentOldLayer);
                    } catch {
                      // Ignore
                    }
                  }, 150);
                }
              } catch {
                // Map may have been destroyed (e.g. unmounted)
              }
            }, 0);
          });

          let mouseMoveTimeout: NodeJS.Timeout | null = null;
          const handleMouseMove = (e: L.LeafletMouseEvent) => {
            if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
              const mouseLat = e.latlng.lat;
              const mouseLng = e.latlng.lng;
              let closestPoint: HeatmapData | null = null;
              let minDistance = Infinity;
              const searchRadius = 0.01;
              const pointsToSearch = heatmapDataRef.current.slice(0, 1000);
              for (const point of pointsToSearch) {
                const distance = Math.sqrt(
                  Math.pow(point.lat - mouseLat, 2) + Math.pow(point.lng - mouseLng, 2)
                );
                if (distance < searchRadius && distance < minDistance) {
                  minDistance = distance;
                  closestPoint = point;
                }
              }
              if (closestPoint) {
                setHoverData({ lat: closestPoint.lat, lng: closestPoint.lng, data: closestPoint.data || {} });
                const containerPoint = map.latLngToContainerPoint(e.latlng);
                setTooltipPosition({ x: containerPoint.x, y: containerPoint.y });
              } else {
                setHoverData(null);
                setTooltipPosition(null);
              }
            }, 50);
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
        } else {
          if (currentOldLayer) {
            map.removeLayer(currentOldLayer);
            setHeatmapLayer(null);
          }
          if (polygonLayerRef.current) {
            try {
              map.removeLayer(polygonLayerRef.current);
            } catch {
              // Ignore
            }
            polygonLayerRef.current = null;
          }
          heatmapDataRef.current = [];
        }

        // Map is for statistical analysis only - no individual property markers
        // Only show heatmaps and cluster visualizations

      } catch (error: any) {
        if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
          console.error('Error loading map data:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (immediate) {
      makeRequest();
    } else {
      // Debounce: wait 400ms after last pan event, 200ms after zoom
      const delay = 400;
      debounceTimer.current = setTimeout(makeRequest, delay);
    }
  }, [map, analysisMode, spatialPatternType, hotspotControls, filters, onPropertiesCountChange, heatmapLayer]);

  // Handle map events
  useEffect(() => {
    if (!map) return;
    
    const handleMoveEnd = () => loadData(false); // Debounced
    
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      const previousZoom = lastZoom.current;
      
      // If zooming in from level 12+, don't reload (data is already loaded)
      if (previousZoom !== null && previousZoom >= 12 && currentZoom > previousZoom) {
        // Just update the last zoom, don't reload
        lastZoom.current = currentZoom;
        return;
      }
      
      // For zoom out or zooming in from < 12, reload data
      lastZoom.current = currentZoom;
      loadData(true);
    };
    
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);
    
    // Initial load
    lastZoom.current = map.getZoom();
    loadData(true);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      requestManager.current.cancelAll();
    };
  }, [loadData, map]);

  // Add mouse move event handler for tooltip
  useEffect(() => {
    if (!map || heatmapDataRef.current.length === 0) return;

    let mouseMoveTimeout: NodeJS.Timeout | null = null;
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      // Debounce mouse move to prevent blocking
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
      
      mouseMoveTimeout = setTimeout(() => {
        const mouseLat = e.latlng.lat;
        const mouseLng = e.latlng.lng;
        
        // Find the closest heatmap point within a reasonable distance
        // Limit search to prevent blocking with large datasets
        let closestPoint: HeatmapData | null = null;
        let minDistance = Infinity;
        const searchRadius = 0.01; // degrees, roughly 1km
        const maxSearchPoints = 1000; // Limit search to prevent blocking
        
        const pointsToSearch = heatmapDataRef.current.slice(0, maxSearchPoints);
        for (const point of pointsToSearch) {
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
      }, 50); // 50ms debounce
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
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<L.Map>(null);
  
  // Background prefetching for adjacent viewports
  useViewportPrefetch(mapRef, filters, true);

  // Default center: Ireland
  const defaultCenter: [number, number] = [53.41291, -8.24389];
  const defaultZoom = 7;

  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
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
          // Map ready, data will be loaded by MapVisualization
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapVisualization 
          analysisMode={analysisMode}
          spatialPatternType={spatialPatternType}
          hotspotControls={hotspotControls}
          filters={filters}
          onPropertiesCountChange={onPropertiesCountChange}
          onLoadingChange={setIsLoading}
        />
      </MapContainer>
      <MapLoadingOverlay isLoading={isLoading} />
    </div>
  );
}

